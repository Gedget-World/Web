"use client";

import type React from "react";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CreditCard, Package, Truck } from "lucide-react";

export function CheckoutForm({ user }: { user: User }) {
  const { items, clearCart, appliedCoupon } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 10;

  // Calculate discount based on applied coupon
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

  const [tab, setTab] = useState<"contact" | "shipping" | "payment">("contact");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address: "",
    address1: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    console.log("Shipping Info:", shippingInfo);
  }, [shippingInfo]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          total,
          appliedCoupon,
          discount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-center items-center gap-3 mb-6">
        <div
          className={`rounded-full font-semibold text-xs w-8 h-8 flex items-center justify-center ${
            tab === "contact" ? "bg-black text-white" : "bg-black text-white"
          }`}
        >
          1
        </div>
        <div
          className={`h-0.5 w-[50px] rounded-2xl ${
            tab === "contact" ? "bg-gray-100" : "bg-black"
          }`}
        ></div>
        <div
          className={`rounded-full font-semibold text-xs w-8 h-8 flex items-center justify-center ${
            tab === "shipping"
              ? "bg-black text-white"
              : tab === "payment"
              ? "bg-black text-white"
              : "bg-gray-100 text-black-700"
          }`}
        >
          2
        </div>
        <div
          className={`h-0.5 w-[50px] rounded-2xl ${
            tab === "payment" ? "bg-black" : "bg-gray-100"
          }`}
        ></div>
        <div
          className={`rounded-full font-semibold text-xs w-8 h-8 flex items-center justify-center ${
            tab === "payment"
              ? "bg-black text-white"
              : "bg-gray-100 text-black-700"
          }`}
        >
          3
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {tab === "contact" && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <Package />{" "}
                    <span className="ml-2">Contact Information</span>
                  </div>
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  We'll use this to send you order updates and receipts.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <Button disabled variant={"outline"} className="mt-4">
                    <ArrowLeft /> Back
                  </Button>
                  <Button onClick={() => setTab("shipping")} className="mt-4">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "shipping" && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <Truck /> <span className="ml-2">Shipping Information</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    required
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address1">Apartment, suite, etc.</Label>
                    <Input
                      id="address1"
                      required
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          address1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      required
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      required
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          zipCode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab("contact")}
                    className="mt-4"
                  >
                    <ArrowLeft /> Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        !shippingInfo.fullName ||
                        !shippingInfo.address ||
                        !shippingInfo.city ||
                        !shippingInfo.state ||
                        !shippingInfo.zipCode
                      ) {
                        alert("Please fill in all required shipping fields.");
                        return;
                      }
                      setTab("payment");
                    }}
                    className="mt-4"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "payment" && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <CreditCard />{" "}
                    <span className="ml-2">Payment Information</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" required />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab("shipping")}
                    className="mt-4"
                  >
                    <ArrowLeft /> Back
                  </Button>
                  <form onSubmit={handleSubmit} className="inline">
                    <Button
                      type="submit"
                      size="lg"
                      className="mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Place Order"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20 py-2 px-0 shadow-none">
            <CardHeader className="px-4 mt-3 py-0">
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 py-0 pb-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-10 h-10 bg-slate-100 rounded overflow-hidden">
                      <Image
                        src={
                          item.image_url ||
                          "/placeholder.svg?height=64&width=64"
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs mt-1 text-slate-700">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      &#8377;{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>&#8377;{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span>&#8377;{shipping.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-&#8377;{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-md font-bold text-slate-900 pt-2 border-t">
                  <span>Total</span>
                  <span>&#8377;{total.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
