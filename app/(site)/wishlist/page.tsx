"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Loader2,
  Package,
  ChevronRight,
  Home,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useWishlist,
  useWishlistStore,
  WishlistItem,
} from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { createClient } from "@/lib/supabase/client";

export default function WishlistPage() {
  const { removeItem, initialize, isLoading } = useWishlist();
  const { serverItems, items, isHydrated } = useWishlistStore();
  const { addItem: addToCart, getItemQuantity } = useCart();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [movingToCart, setMovingToCart] = useState<string | null>(null);
  const [isMovingAllToCart, setIsMovingAllToCart] = useState(false);
  const [stockByProductId, setStockByProductId] = useState<
    Record<string, { stock: number; is_out_of_stock: boolean }>
  >({});

  const supabase = useMemo(() => createClient(), []);

  // Check auth status and initialize wishlist
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await initialize();
      }
    };
    checkAuth();
  }, []);

  // Fetch product details for local items (guest users)
  useEffect(() => {
    const fetchLocalProducts = async () => {
      if (user || items.length === 0) {
        setLocalProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const productIds = items.map((item) => item.productId);
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, slug, description, price, image_url, stock, is_out_of_stock, discount_percentage, is_new_arrival, is_featured",
          )
          .in("id", productIds);

        if (!error && data) {
          setLocalProducts(data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isHydrated) {
      fetchLocalProducts();
    }
  }, [user, items, isHydrated]);

  const baseDisplayItems = user
    ? serverItems
    : (items
        .map((item) => {
          const product = localProducts.find((p) => p.id === item.productId);
          return product
            ? {
                id: item.productId,
                productId: item.productId,
                createdAt: new Date(item.addedAt).toISOString(),
                product: {
                  ...product,
                  is_out_of_stock:
                    product.is_out_of_stock || product.stock <= 0,
                },
              }
            : null;
        })
        .filter(Boolean) as WishlistItem[]);

  const stockCheckIds = baseDisplayItems
    .map((item) => item.productId)
    .join(",");

  useEffect(() => {
    const refreshStockStatus = async () => {
      if (!isHydrated) return;

      const productIds = stockCheckIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (productIds.length === 0) {
        setStockByProductId({});
        return;
      }

      setCheckingStock(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, stock, is_out_of_stock")
          .in("id", productIds);

        if (!error && data) {
          setStockByProductId(
            Object.fromEntries(
              data.map((product) => [
                product.id,
                {
                  stock: product.stock ?? 0,
                  is_out_of_stock:
                    product.is_out_of_stock || (product.stock ?? 0) <= 0,
                },
              ]),
            ),
          );
        }
      } catch (error) {
        console.error("Error refreshing stock:", error);
      } finally {
        setCheckingStock(false);
      }
    };

    refreshStockStatus();
  }, [isHydrated, stockCheckIds, supabase]);

  const displayItems = baseDisplayItems.map((item) => {
    if (!item.product) {
      return item;
    }

    const latestAvailability = stockByProductId[item.productId];
    const latestStock = latestAvailability?.stock ?? item.product.stock;
    const latestOutOfStock =
      (latestAvailability?.is_out_of_stock ?? item.product.is_out_of_stock) ||
      latestStock <= 0;

    return {
      ...item,
      product: {
        ...item.product,
        stock: latestStock,
        is_out_of_stock: latestOutOfStock,
      },
    };
  });

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item.product) return;
    if (checkingStock) return;
    if (item.product.is_out_of_stock || item.product.stock <= 0) return;

    setMovingToCart(item.productId);

    const product = item.product;
    const success = addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
    });

    if (success) {
      // Remove from wishlist after adding to cart
      await removeItem(item.productId);
    }
    setMovingToCart(null);
  };

  const handleMoveAllToCart = async () => {
    setIsMovingAllToCart(true);
    try {
      for (const item of addableItems) {
        if (item.product) {
          await handleMoveToCart(item);
        }
      }
    } finally {
      setIsMovingAllToCart(false);
    }
  };

  const isPageLoading = isLoading || loadingProducts || !isHydrated;
  const hasItems = displayItems.length > 0;
  const inStockItems = displayItems.filter(
    (item) =>
      item.product && !item.product.is_out_of_stock && item.product.stock > 0,
  );
  const addableItems = displayItems.filter((item) => {
    if (
      !item.product ||
      item.product.is_out_of_stock ||
      item.product.stock <= 0
    ) {
      return false;
    }

    return getItemQuantity(item.productId) < item.product.stock;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Wishlist</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-100 rounded-xl">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  My Wishlist
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {hasItems
                    ? `${displayItems.length} ${displayItems.length === 1 ? "item" : "items"} saved for later`
                    : "Your wishlist is empty"}
                </p>
              </div>
            </div>

            {hasItems && (
              <Button
                onClick={handleMoveAllToCart}
                disabled={
                  isMovingAllToCart ||
                  checkingStock ||
                  addableItems.length === 0
                }
                className="group relative overflow-hidden rounded-xl border border-primary/15 bg-linear-to-r from-primary via-primary to-primary/90 px-5 text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:translate-y-0 disabled:opacity-70"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  {isMovingAllToCart || checkingStock ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span>
                    {checkingStock
                      ? "Checking Stock..."
                      : isMovingAllToCart
                        ? "Adding Items..."
                        : addableItems.length === 0
                          ? "Nothing to Add"
                          : "Add All to Cart"}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90">
                    <Sparkles className="h-3 w-3" />
                    {addableItems.length} ready
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isPageLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your wishlist...</p>
          </div>
        )}

        {/* Empty State */}
        {!isPageLoading && !hasItems && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-pink-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Save items you love by clicking the heart icon on any product.
                They&apos;ll appear here so you can easily find them later.
              </p>
              <Button asChild size="lg">
                <Link href="/products">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wishlist Items */}
        {!isPageLoading && hasItems && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            {/* Items Grid */}
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  const isOutOfStock =
                    product.is_out_of_stock || product.stock <= 0;
                  const hasDiscount =
                    product.discount_percentage &&
                    product.discount_percentage > 0;
                  const originalPrice = hasDiscount
                    ? Math.round(
                        product.price /
                          (1 - product.discount_percentage! / 100),
                      )
                    : null;
                  const cartQuantity = getItemQuantity(item.productId);
                  const isMaxInCart = cartQuantity >= product.stock;

                  return (
                    <Card
                      key={item.id}
                      className="overflow-hidden group hover:shadow-lg bg-white transition-shadow p-0 gap-0"
                    >
                      <div className="relative aspect-square bg-gray-50">
                        <Link href={`/products/${product.slug}`}>
                          <Image
                            src={
                              product.image_url ||
                              "/placeholder.svg?height=300&width=300"
                            }
                            alt={product.name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          {isOutOfStock && (
                            <Badge className="bg-gray-900/90 text-white text-xs">
                              Out of Stock
                            </Badge>
                          )}
                          {hasDiscount && !isOutOfStock && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {product.discount_percentage}% OFF
                            </Badge>
                          )}
                          {product.is_new_arrival && (
                            <Badge className="bg-emerald-500 text-white text-xs flex items-center gap-0.5">
                              <Sparkles className="w-3 h-3" />
                              New
                            </Badge>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleRemove(item.productId)}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CardContent className="px-4  pt-0 pb-4">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{Math.floor(product.price).toLocaleString("en-IN")}
                          </span>
                          {originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            className="flex-1"
                            disabled={
                              checkingStock ||
                              movingToCart === item.productId ||
                              isOutOfStock ||
                              isMaxInCart
                            }
                            onClick={() => handleMoveToCart(item)}
                          >
                            {movingToCart === item.productId ||
                            checkingStock ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            {checkingStock
                              ? "Checking Stock"
                              : isOutOfStock
                                ? "Out of Stock"
                                : isMaxInCart
                                  ? "Max in Cart"
                                  : "Add to Cart"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemove(item.productId)}
                            className="hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {cartQuantity > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {cartQuantity} already in cart
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">
                    Wishlist Summary
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items</span>
                      <span className="font-medium">{displayItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In Stock</span>
                      <span className="font-medium text-green-600">
                        {inStockItems.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Out of Stock
                      </span>
                      <span className="font-medium text-red-500">
                        {displayItems.length - inStockItems.length}
                      </span>
                    </div>

                    <hr className="my-4" />

                    <div className="flex justify-between text-base">
                      <span className="font-medium">Estimated Total</span>
                      <span className="font-bold text-primary">
                        ₹
                        {displayItems
                          .reduce((sum, item) => {
                            if (item.product) {
                              return sum + item.product.price;
                            }
                            return sum;
                          }, 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {!user && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3">
                        <strong>Sign in</strong> to sync your wishlist across
                        devices and never lose your saved items!
                      </p>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">Sign In</Link>
                      </Button>
                    </div>
                  )}

                  <Button asChild className="w-full mt-6" variant="outline">
                    <Link href="/products">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
