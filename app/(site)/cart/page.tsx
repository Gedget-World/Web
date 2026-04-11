"use client";

import { useCart } from "@/hooks/use-cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CouponInput } from "@/components/coupon-input";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, appliedCoupon } = useCart();
  const { getSetting, loading: settingsLoading } = useStoreSettings([
    "currency_symbol",
  ]);

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

  if (items.length === 0) {
    return (
      <main className="min-h-screen py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300 mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-slate-600 mb-8">Add some items to get started</p>
          <Button asChild size="lg">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-5 px-4 md:px-8 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-5">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border shadow-none p-3">
              <CardContent className="p-2">
                <div className="flex gap-4">
                  <div className="relative w-22 h-22 shrink-0 bg-slate-100 rounded-md overflow-hidden">
                    <Image
                      src={
                        item.image_url ||
                        "/placeholder.svg?height=100&width=100"
                      }
                      alt={item.name}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-md w-[90%] text-black line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-slate-700 font-semibold text-sm mt-2">
                        {currencySymbol}
                        {item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          disabled={
                            item.stock !== undefined &&
                            item.quantity >= item.stock
                          }
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                              item.stock,
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.stock !== undefined &&
                        item.quantity >= item.stock && (
                          <span className="text-amber-600 text-xs font-medium">
                            Max {item.stock} available
                          </span>
                        )}
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 cursor-pointer"
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
          <Card className="sticky top-20">
            <CardContent>
              <h2 className="text-md font-semibold text-black mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-700 text-sm">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>
                      -{currencySymbol}
                      {discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-md font-bold text-black">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Have a coupon?
                </h3>
                <CouponInput subtotal={subtotal} />
              </div>

              {/* COD Information */}
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Cash on Delivery (COD):</span>{" "}
                  Available only for orders minimum ₹599 without any coupon
                  applied.
                </p>
              </div>

              <Button asChild size="lg" className="w-full mb-3">
                <Link href="/checkout">
                  <ShoppingBag /> Proceed to Checkout <ArrowRight />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full bg-transparent"
              >
                <Link href="/products">
                  {" "}
                  <ShoppingCart />
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
