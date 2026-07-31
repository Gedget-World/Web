"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CouponInput } from "@/components/coupon-input";
import { Badge } from "@/components/ui/badge";
import { RecommendedProducts } from "@/components/recommended-products";
import { createClient } from "@/lib/supabase/client";
import { clientLogger } from "@/lib/client-logger";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
  Shield,
  Truck,
  RotateCcw,
  Clock,
  Gift,
  Tag,
  CheckCircle2,
  Package,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";

const LOG_SOURCE = "cart/page";

export default function CartPage() {
  const { items, updateQuantity, updateItemStock, removeItem, appliedCoupon } =
    useCart();
  const { getSetting, loading: settingsLoading } = useStoreSettings([
    "currency_symbol",
  ]);
  const supabase = useMemo(() => createClient(), []);
  const hasValidatedInitialCart = useRef(false);
  const [isGift, setIsGift] = useState(false);

  useEffect(() => {
    const validateCartOnFirstLoad = async () => {
      if (items.length === 0 || hasValidatedInitialCart.current) {
        return;
      }

      hasValidatedInitialCart.current = true;

      const productIds = items.map((item) => item.id);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, stock, is_out_of_stock, is_active")
          .in("id", productIds);

        if (error) {
          clientLogger.error("Failed to validate cart items", {
            source: LOG_SOURCE,
            context: { error: error.message, productIds },
          });
          return;
        }

        const productsById = new Map(
          data?.map((product) => [product.id, product]),
        );

        items.forEach((item) => {
          const product = productsById.get(item.id);

          if (!product || product.is_active === false) {
            clientLogger.warn("Cart item removed: product unavailable", {
              source: LOG_SOURCE,
              context: {
                productId: item.id,
                reason: !product ? "not_found" : "inactive",
              },
            });
            removeItem(item.id);
            return;
          }

          if (product.is_out_of_stock || (product.stock ?? 0) <= 0) {
            clientLogger.warn("Cart item removed: out of stock", {
              source: LOG_SOURCE,
              context: { productId: item.id },
            });
            removeItem(item.id);
            return;
          }

          if (item.quantity > (product.stock ?? 0)) {
            clientLogger.warn(
              "Cart item quantity reduced to match available stock",
              {
                source: LOG_SOURCE,
                context: {
                  productId: item.id,
                  requestedQuantity: item.quantity,
                  availableStock: product.stock ?? 0,
                },
              },
            );
            updateItemStock(item.id, product.stock ?? 0);
            return;
          }

          updateItemStock(item.id, product.stock ?? 0);
        });
      } catch (err) {
        clientLogger.error("Unexpected error validating cart items", {
          source: LOG_SOURCE,
          context: {
            error: err instanceof Error ? err.message : String(err),
            productIds,
          },
        });
      }
    };

    validateCartOnFirstLoad();
  }, [items, removeItem, supabase, updateItemStock]);

  const handleQuantityChange = (
    item: (typeof items)[number],
    newQuantity: number,
  ) => {
    const success = updateQuantity(item.id, newQuantity, item.stock);

    if (!success) {
      clientLogger.warn("Cart quantity change blocked: exceeds stock", {
        source: LOG_SOURCE,
        context: {
          productId: item.id,
          requestedQuantity: newQuantity,
          availableStock: item.stock,
        },
      });
      return;
    }

    if (newQuantity <= 0) {
      clientLogger.info("Cart item removed via quantity decrement", {
        source: LOG_SOURCE,
        context: { productId: item.id },
      });
    }
  };

  const currencySymbol = getSetting("currency_symbol", "₹");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Always free shipping
  const shipping = 0;

  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.min_purchase_amount) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount) {
        discount = Math.min(discount, appliedCoupon.max_discount_amount);
      }
    } else {
      discount = appliedCoupon.discount_value;
    }
  }

  const total = subtotal + shipping - discount;

  // Calculate total items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Empty Cart Message */}
        <div className="text-center py-12 border-b mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50" />
            <div className="relative bg-linear-to-br from-slate-100 to-slate-200 rounded-full p-6">
              <ShoppingCart className="h-12 w-12 text-slate-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-slate-500 text-sm mb-4 max-w-sm mx-auto">
            Add items to your cart and they will appear here
          </p>
          <Button asChild size="default" className="gap-2">
            <Link href="/products">
              <Sparkles className="h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Recommended Products */}
        <RecommendedProducts title="Recommended For You" limit={8} />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-5 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header with item count */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="border shadow-none p-3 hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-2">
                <div className="flex gap-4">
                  <Link
                    href={`/products/${item.id}`}
                    className="relative w-22 h-22 shrink-0 bg-slate-100 rounded-md overflow-hidden group"
                  >
                    <Image
                      src={
                        item.image_url ||
                        "/placeholder.svg?height=100&width=100"
                      }
                      alt={item.name}
                      fill
                      sizes="88px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.id}`}>
                        <h3 className="font-semibold text-md w-[90%] text-black line-clamp-1 hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-900 font-bold text-sm">
                          {currencySymbol}
                          {item.price.toLocaleString("en-IN")}
                        </p>
                        {item.quantity > 1 && (
                          <span className="text-slate-400 text-xs">
                            × {item.quantity} = {currencySymbol}
                            {(item.price * item.quantity).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md hover:bg-slate-200"
                          onClick={() =>
                            handleQuantityChange(item, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md hover:bg-slate-200"
                          disabled={
                            item.stock !== undefined &&
                            item.quantity >= item.stock
                          }
                          onClick={() =>
                            handleQuantityChange(item, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {item.stock !== undefined &&
                        item.quantity >= item.stock && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-200 bg-amber-50 text-[10px]"
                          >
                            Max available
                          </Badge>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        clientLogger.info("Cart item removed by user", {
                          source: LOG_SOURCE,
                          context: {
                            productId: item.id,
                            quantity: item.quantity,
                          },
                        });
                        removeItem(item.id);
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-slate-200">
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-slate-700" />
                <h2 className="text-md font-semibold text-black">
                  Order Summary
                </h2>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-slate-900 font-medium">
                    {currencySymbol}
                    {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Free
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium text-sm bg-green-50 -mx-2 px-2 py-1.5 rounded">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      Coupon Discount
                    </span>
                    <span>
                      -{currencySymbol}
                      {discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-md font-bold text-black">
                  <span>Total</span>
                  <span className="text-lg">
                    {currencySymbol}
                    {total.toLocaleString("en-IN")}
                  </span>
                </div>
                {discount > 0 && (
                  <p className="text-xs text-green-600 text-right">
                    You're saving {currencySymbol}
                    {discount.toLocaleString("en-IN")} on this order!
                  </p>
                )}
              </div>
              <div className="mb-5">
                <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  Have a coupon?
                </h3>
                <CouponInput subtotal={subtotal} />
              </div>
              {/* COD Information */}
              <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Cash on Delivery (COD):</span>{" "}
                  Available only for order value of Rs. 599 and above. 20%
                  advance to be paid for the cash on delivery orders.
                </p>
              </div>

              <label
                htmlFor="is-gift"
                className={`mb-5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isGift
                    ? "border-pink-300 bg-pink-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isGift
                      ? "bg-pink-100 text-pink-600"
                      : "bg-white text-slate-400"
                  }`}
                >
                  <Gift className="h-4.5 w-4.5" />
                </div>
                <span className="flex-1 text-sm font-medium text-black">
                  This order is a gift 🎁
                </span>
                <Checkbox
                  id="is-gift"
                  checked={isGift}
                  onCheckedChange={(checked) => {
                    const nextIsGift = checked === true;
                    setIsGift(nextIsGift);
                    clientLogger.info("Gift option toggled", {
                      source: LOG_SOURCE,
                      context: { isGift: nextIsGift },
                    });
                  }}
                  className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                />
              </label>

              <Button
                asChild
                size="lg"
                className="w-full mb-3 h-12 text-base font-semibold"
              >
                <Link
                  href={`/checkout?isGift=${isGift}`}
                  onClick={() =>
                    clientLogger.info("Proceeded to checkout from cart", {
                      source: LOG_SOURCE,
                      context: {
                        itemCount: totalItems,
                        subtotal,
                        total,
                        isGift,
                        couponApplied: Boolean(appliedCoupon),
                      },
                    })
                  }
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Secure Checkout
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full bg-transparent"
              >
                <Link href="/products">
                  <ShoppingCart className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              {/* Trust Badges */}
              <div className="mt-5 pt-5 border-t border-dashed">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-xs">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Truck className="h-4 w-4 text-purple-600" />
                    <span className="text-xs">Fast Delivery</span>
                  </div>
                </div>
              </div>
              {/* Payment Methods */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 text-center mb-2">
                  We accept
                </p>
                <div className="flex items-center justify-center gap-3 text-slate-400">
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded">
                    VISA
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded">
                    Mastercard
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded">
                    UPI
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded">
                    COD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="mt-10 pt-8 border-t">
        <RecommendedProducts title="You May Also Like" limit={8} />
      </div>
    </main>
  );
}
