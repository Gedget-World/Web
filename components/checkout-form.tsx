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
import ContactForm from "./contact-form";

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
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });
  const [customerInfo, setCustomerInfo] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    console.log("Shipping Info:", shippingInfo);
  }, [shippingInfo]);

  useEffect(() => {
    // Fetch customer info and existing address
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`/api/customers/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerInfo(data.customer);

          // Set full name from customer data
          if (data.customer) {
            const fullName = `${data.customer.first_name || ""} ${
              data.customer.last_name || ""
            }`.trim();
            setShippingInfo((prev) => ({ ...prev, fullName }));
          }

          // Set existing address if available
          if (data.address) {
            setShippingInfo((prev) => ({
              ...prev,
              address_line1: data.address.address_line1 || "",
              address_line2: data.address.address_line2 || "",
              city: data.address.city || "",
              state: data.address.state || "",
              postal_code: data.address.postal_code || "",
              country: data.address.country || "US",
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      }
    };

    fetchCustomerData();
  }, [user.id]);

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
          // Order details
          user_id: user.id,
          total,
          status: "pending",

          // Customer information
          customer_name: shippingInfo.fullName,
          customer_email: user.email,

          // Shipping address details (flattened to match schema)
          shipping_address: `${shippingInfo.address_line1}${
            shippingInfo.address_line2 ? ", " + shippingInfo.address_line2 : ""
          }, ${shippingInfo.state}`, // Added state to address
          shipping_city: shippingInfo.city,
          shipping_postal_code: shippingInfo.postal_code,
          shipping_country: shippingInfo.country,

          // Coupon and discount information
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discount || 0,

          // Order items for order_items table
          order_items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),

          // Additional metadata (you can remove payment_method if not adding to schema)
          metadata: {
            payment_method: paymentMethod,
            shipping_state: shippingInfo.state,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
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
                <ContactForm user={{ id: user.id, email: user.email || "" }} />

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
                    value={shippingInfo.fullName}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line1">Address 1</Label>
                  <Textarea
                    id="address_line1"
                    required
                    value={shippingInfo.address_line1}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address_line1: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line2">Address 2</Label>
                  <Textarea
                    id="address_line2"
                    value={shippingInfo.address_line2}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address_line2: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={shippingInfo.city}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      required
                      value={shippingInfo.postal_code}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          postal_code: e.target.value,
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
                      value={shippingInfo.state}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      required
                      value={shippingInfo.country}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          country: e.target.value,
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
                    onClick={async () => {
                      if (
                        !shippingInfo.fullName ||
                        !shippingInfo.address_line1 ||
                        !shippingInfo.city ||
                        !shippingInfo.state ||
                        !shippingInfo.postal_code ||
                        !shippingInfo.country
                      ) {
                        alert("Please fill in all required shipping fields.");
                        return;
                      }

                      // Save/update address before proceeding to payment
                      try {
                        setIsLoading(true);
                        const response = await fetch("/api/addresses", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            user_id: user.id,
                            address: {
                              full_name: shippingInfo.fullName,
                              address_line1: shippingInfo.address_line1,
                              address_line2: shippingInfo.address_line2,
                              city: shippingInfo.city,
                              state: shippingInfo.state,
                              postal_code: shippingInfo.postal_code,
                              country: shippingInfo.country,
                              type: "shipping",
                              is_default: true,
                            },
                          }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to save address");
                        }

                        setTab("payment");
                      } catch (error) {
                        console.error("Error saving address:", error);
                        alert("Failed to save address. Please try again.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Continue"}
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
                <div className="grid gap-4">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod("cod")}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="cod"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="online"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={(e) => setPaymentMethod("online")}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="online"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Online Payment
                      </Label>
                    </div>
                  </div>
                </div>

                {paymentMethod === "online" && (
                  <>
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
                  </>
                )}
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
