"use client";

import { useEffect, useState } from "react";
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
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/client";

export default function WishlistPage() {
  const { removeItem, fetchWishlist, initialize, isLoading } = useWishlist();
  const { serverItems, items, isHydrated } = useWishlistStore();
  const { addItem: addToCart, getItemQuantity } = useCart();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [movingToCart, setMovingToCart] = useState<string | null>(null);

  const supabase = createClient();

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
            "id, name, slug, description, price, image_url, stock, discount_percentage, is_new_arrival, is_featured",
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

  // Get display items based on auth status
  const displayItems = user
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
                  is_out_of_stock: product.stock <= 0,
                },
              }
            : null;
        })
        .filter(Boolean) as WishlistItem[]);

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item.product) return;
    setMovingToCart(item.productId);

    // Add to cart
    const product = item.product;
    const success = addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      discount_percentage: product.discount_percentage,
      is_out_of_stock: product.stock <= 0,
    });

    if (success) {
      // Remove from wishlist after adding to cart
      await removeItem(item.productId);
    }
    setMovingToCart(null);
  };

  const handleMoveAllToCart = async () => {
    for (const item of displayItems) {
      if (item.product && item.product.stock > 0) {
        const cartQty = getItemQuantity(item.productId);
        if (cartQty < item.product.stock) {
          await handleMoveToCart(item);
        }
      }
    }
  };

  const isPageLoading = isLoading || loadingProducts || !isHydrated;
  const hasItems = displayItems.length > 0;
  const inStockItems = displayItems.filter(
    (item) => item.product && item.product.stock > 0,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
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

            {hasItems && inStockItems.length > 0 && (
              <Button
                onClick={handleMoveAllToCart}
                className="bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add All to Cart
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Items Grid */}
            <div className="lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {displayItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  const isOutOfStock = product.stock <= 0;
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
                      className="overflow-hidden group hover:shadow-lg transition-shadow"
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

                      <CardContent className="p-4">
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
                            disabled={isOutOfStock || isMaxInCart}
                            onClick={() => handleMoveToCart(item)}
                          >
                            {movingToCart === item.productId ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            {isOutOfStock
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
            <div className="lg:col-span-1">
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
