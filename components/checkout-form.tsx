"use client";

import type React from "react";

import { useCart } from "@/hooks/use-cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CreditCard,
  Package,
  Truck,
  Check,
  Lock,
  Shield,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Calendar,
  Banknote,
  Smartphone,
  Loader2,
  Tag,
  Clock,
} from "lucide-react";
import ContactForm from "./contact-form";
import { RecentlyViewedProducts } from "./recently-viewed-products";
import { useCustomer } from "@/hooks/use-customer";

export function CheckoutForm({ user }: { user: User }) {
  const { items, clearCart, appliedCoupon } = useCart();
  const { getSetting } = useStoreSettings(["currency_symbol", "store_country"]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Use cached customer data
  const {
    customer: cachedCustomer,
    address: cachedAddress,
    isHydrated,
    fetchCustomerData,
    saveAddress,
    isCacheValid,
  } = useCustomer(user.id);

  const currencySymbol = getSetting("currency_symbol", "₹");
  const defaultCountry = getSetting("store_country", "India");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Always free shipping
  const shipping = 0;

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

  // Calculate total items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Estimated delivery date (3-5 business days)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const deliveryDateStr = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const [tab, setTab] = useState<"contact" | "shipping" | "payment">("contact");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderReviewOpen, setOrderReviewOpen] = useState(true);
  const [cardNumber, setCardNumber] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: defaultCountry,
  });
  const [customerInfo, setCustomerInfo] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    console.log("Shipping Info:", shippingInfo);
  }, [shippingInfo]);

  // COD price limits
  const COD_MIN_AMOUNT = 599;
  const COD_MAX_AMOUNT = 10000;

  // Check if COD is available
  const isCodAvailable =
    appliedCoupon === null &&
    subtotal >= COD_MIN_AMOUNT &&
    subtotal <= COD_MAX_AMOUNT;

  // Switch to online payment if COD becomes unavailable
  useEffect(() => {
    if (!isCodAvailable && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [isCodAvailable, paymentMethod]);

  // Use cached customer data or fetch if needed
  useEffect(() => {
    if (!isHydrated) return;

    const loadCustomerData = async () => {
      // Use cache if valid
      if (isCacheValid() && cachedCustomer?.user_id === user.id) {
        const fullName =
          `${cachedCustomer.first_name || ""} ${cachedCustomer.last_name || ""}`.trim();
        if (fullName) {
          setShippingInfo((prev) => ({ ...prev, fullName }));
        }
        setCustomerInfo({
          first_name: cachedCustomer.first_name || "",
          last_name: cachedCustomer.last_name || "",
          phone: cachedCustomer.phone || "",
        });

        if (cachedAddress) {
          setShippingInfo((prev) => ({
            ...prev,
            address_line1: cachedAddress.address_line1 || "",
            address_line2: cachedAddress.address_line2 || "",
            city: cachedAddress.city || "",
            state: cachedAddress.state || "",
            postal_code: cachedAddress.postal_code || "",
            country: cachedAddress.country || defaultCountry,
          }));
        }
        return;
      }

      // Fetch from API if cache is invalid
      const { customer, address } = await fetchCustomerData();

      if (customer) {
        const fullName =
          `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
        if (fullName) {
          setShippingInfo((prev) => ({ ...prev, fullName }));
        }
        setCustomerInfo({
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          phone: customer.phone || "",
        });
      }

      if (address) {
        setShippingInfo((prev) => ({
          ...prev,
          address_line1: address.address_line1 || "",
          address_line2: address.address_line2 || "",
          city: address.city || "",
          state: address.state || "",
          postal_code: address.postal_code || "",
          country: address.country || defaultCountry,
        }));
      }
    };

    loadCustomerData();
  }, [isHydrated, user.id]);

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

      setOrderPlaced(true);
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to cart if empty (must be in useEffect to avoid render-time state updates)
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.push("/cart");
    }
  }, [items.length, orderPlaced, router]);

  if (items.length === 0 && !orderPlaced) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Security Banner */}
      <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-linear-to-r from-green-50 to-emerald-50 rounded-full w-fit mx-auto">
        <Lock className="h-3 w-3 text-green-600" />
        <span className="text-[11px] font-medium text-green-700">
          SSL Secured
        </span>
      </div>

      {/* Enhanced Progress Steps */}
      <div className="flex justify-center items-center gap-2 md:gap-4 mb-6">
        {/* Step 1 - Contact */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-10 h-10 flex items-center justify-center transition-all ${
              tab === "contact"
                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                : tab === "shipping" || tab === "payment"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {tab === "shipping" || tab === "payment" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Package className="h-4 w-4" />
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              tab === "contact" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Contact
          </span>
        </div>

        <div
          className={`h-0.5 w-8 md:w-16 rounded-full transition-all ${
            tab === "shipping" || tab === "payment"
              ? "bg-green-500"
              : "bg-gray-200"
          }`}
        />

        {/* Step 2 - Shipping */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-10 h-10 flex items-center justify-center transition-all ${
              tab === "shipping"
                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                : tab === "payment"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {tab === "payment" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              tab === "shipping" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Shipping
          </span>
        </div>

        <div
          className={`h-0.5 w-8 md:w-16 rounded-full transition-all ${
            tab === "payment" ? "bg-green-500" : "bg-gray-200"
          }`}
        />

        {/* Step 3 - Payment */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-10 h-10 flex items-center justify-center transition-all ${
              tab === "payment"
                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            <CreditCard className="h-4 w-4" />
          </div>
          <span
            className={`text-xs font-medium ${
              tab === "payment" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Payment
          </span>
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

                      // Save/update address using cached hook (updates cache automatically)
                      try {
                        setIsLoading(true);
                        const result = await saveAddress({
                          full_name: shippingInfo.fullName,
                          address_line1: shippingInfo.address_line1,
                          address_line2: shippingInfo.address_line2,
                          city: shippingInfo.city,
                          state: shippingInfo.state,
                          postal_code: shippingInfo.postal_code,
                          country: shippingInfo.country,
                        });

                        if (!result) {
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

                  {/* Payment Method Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* COD Option */}
                    <button
                      type="button"
                      onClick={() => isCodAvailable && setPaymentMethod("cod")}
                      disabled={!isCodAvailable}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        paymentMethod === "cod" && isCodAvailable
                          ? "border-blue-500 bg-blue-50"
                          : isCodAvailable
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {paymentMethod === "cod" && isCodAvailable && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <Banknote
                        className={`h-6 w-6 mb-2 ${
                          isCodAvailable ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-slate-500">
                        Pay when you receive
                      </p>
                      {!isCodAvailable && (
                        <Badge
                          variant="outline"
                          className="mt-2 text-[10px] text-amber-600 border-amber-200"
                        >
                          Not available
                        </Badge>
                      )}
                    </button>

                    {/* Online Payment Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        paymentMethod === "online"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {paymentMethod === "online" && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <CreditCard className="h-6 w-6 mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Online Payment</p>
                      <p className="text-xs text-slate-500">
                        Cards, UPI, Net Banking
                      </p>
                    </button>
                  </div>

                  {/* Payment Icons */}
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-xs text-slate-500">We accept:</span>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 rounded">
                        VISA
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 rounded">
                        Mastercard
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 rounded">
                        UPI
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 rounded">
                        RuPay
                      </span>
                    </div>
                  </div>

                  {/* COD Information */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">
                        Cash on Delivery (COD):
                      </span>{" "}
                      Available only for orders between ₹{COD_MIN_AMOUNT} and ₹
                      {COD_MAX_AMOUNT.toLocaleString()} without any coupon
                      applied.
                    </p>
                  </div>
                </div>

                {paymentMethod === "online" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                          className="pr-12"
                        />
                        {/* Card Brand Detection */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {cardNumber.startsWith("4") ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                              VISA
                            </span>
                          ) : cardNumber.startsWith("5") ? (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                              MC
                            </span>
                          ) : cardNumber.startsWith("6") ? (
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              RuPay
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Order Review Accordion */}
                <Collapsible
                  open={orderReviewOpen}
                  onOpenChange={setOrderReviewOpen}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <span className="text-sm font-medium">
                        Review Your Order ({totalItems} items)
                      </span>
                      {orderReviewOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 space-y-2 border border-t-0 rounded-b-lg">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-3 w-3 text-green-500" />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-slate-600">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm font-semibold flex justify-between">
                          <span>Total:</span>
                          <span>
                            {currencySymbol}
                            {total.toLocaleString("en-IN")}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs text-slate-600 cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link
                      href="/policies/terms"
                      className="text-blue-600 hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/policies/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab("shipping")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <form onSubmit={handleSubmit} className="inline">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading || !termsAccepted}
                      className="min-w-[180px] h-12 text-base font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Pay {currencySymbol}
                          {total.toLocaleString("en-IN")}
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-none border-slate-200">
            <CardHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Order Summary</CardTitle>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Badge>
                </div>
                <Link
                  href="/cart"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 py-0 pb-4">
              {/* Products with hover */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 group">
                    <div className="relative w-12 h-12 bg-slate-100 rounded overflow-hidden group-hover:ring-2 ring-blue-200 transition-all">
                      <Image
                        src={
                          item.image_url ||
                          "/placeholder.svg?height=64&width=64"
                        }
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                      {/* Badge showing quantity */}
                      <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currencySymbol}
                        {item.price.toLocaleString("en-IN")} each
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 shrink-0">
                      {currencySymbol}
                      {(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Estimated Delivery */}
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-900">
                    Estimated Delivery
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold">
                    {deliveryDateStr}
                  </p>
                </div>
                <Clock className="h-3.5 w-3.5 text-blue-500" />
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium bg-green-50 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Discount ({appliedCoupon?.code})
                    </span>
                    <span>
                      -{currencySymbol}
                      {discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Savings Highlight */}
              {discount > 0 && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold text-green-700">
                    You're saving {currencySymbol}
                    {discount.toLocaleString("en-IN")} on this order!
                  </p>
                </div>
              )}

              {/* Order Protection Badge */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Order Protection
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Your order is protected & secure
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="flex flex-col items-center text-center p-2">
                  <Shield className="h-4 w-4 text-green-600 mb-1" />
                  <span className="text-[10px] text-slate-600">Secure Pay</span>
                </div>
                <div className="flex flex-col items-center text-center p-2">
                  <RotateCcw className="h-4 w-4 text-blue-600 mb-1" />
                  <span className="text-[10px] text-slate-600">
                    Easy Return
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-2">
                  <Truck className="h-4 w-4 text-purple-600 mb-1" />
                  <span className="text-[10px] text-slate-600">
                    Free Delivery
                  </span>
                </div>
              </div>

              {/* Money Back Guarantee */}
              <div className="text-center p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-[10px] text-amber-700 font-medium">
                  30-Day Money Back Guarantee
                </p>
              </div>

              {/* Customer Support */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-1 text-slate-600">
                  <Headphones className="h-3.5 w-3.5" />
                  <span className="text-[10px]">24/7 Support</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-[10px]">1800-XXX-XXXX</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recently Viewed Products */}
      <div className="mt-8 pt-6 border-t">
        <RecentlyViewedProducts />
      </div>
    </div>
  );
}
