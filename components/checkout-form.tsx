"use client";

import type React from "react";

import { useCart } from "@/hooks/use-cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useCashfreePayment } from "@/hooks/use-cashfree-payment";
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
  const {
    initiatePayment: initiateCashfreePayment,
    isLoading: cashfreeLoading,
    error: cashfreeError,
  } = useCashfreePayment();

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
      // Step 1: Create order in database
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Order details
          user_id: user.id,
          total,
          status: paymentMethod === "cod" ? "confirmed" : "pending",

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

          // Additional metadata
          metadata: {
            payment_method: paymentMethod,
            shipping_state: shippingInfo.state,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.orderId;

      if (!orderId) {
        throw new Error("Order created but no ID returned");
      }

      // Step 2: Handle payment based on method
      if (paymentMethod === "cod") {
        // For COD, order is already confirmed
        setOrderPlaced(true);
        clearCart();
        router.push("/checkout/success");
      } else if (paymentMethod === "online") {
        // For online payment, initiate Cashfree payment
        const phoneNumber = customerInfo?.phone || shippingInfo.fullName;

        if (!phoneNumber) {
          throw new Error("Phone number is required for online payment");
        }

        try {
          await initiateCashfreePayment({
            orderId,
            amount: total,
            customerEmail: user.email || "",
            customerPhone: phoneNumber,
            customerName: shippingInfo.fullName,
          });

          // If payment was successful, Cashfree will handle the redirect
          // or we can manually redirect to success
          setOrderPlaced(true);
          clearCart();
        } catch (paymentError) {
          // Payment failed or was cancelled
          setError(
            paymentError instanceof Error
              ? paymentError.message
              : "Payment failed. Please try again.",
          );
        }
      }
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
    <div className="flex flex-col space-y-3 sm:space-y-4">
      {/* Security Banner */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 px-2 sm:px-3 bg-linear-to-r from-green-50 to-emerald-50 rounded-full w-fit mx-auto">
        <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
        <span className="text-[10px] sm:text-[11px] font-medium text-green-700">
          SSL Secured
        </span>
      </div>

      {/* Enhanced Progress Steps */}
      <div className="flex justify-center items-center gap-1 sm:gap-2 md:gap-4 mb-4 md:mb-6 px-2">
        {/* Step 1 - Contact */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all ${
              tab === "contact"
                ? "bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100"
                : tab === "shipping" || tab === "payment"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {tab === "shipping" || tab === "payment" ? (
              <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-xs font-medium ${
              tab === "contact" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Contact
          </span>
        </div>

        <div
          className={`h-0.5 w-6 sm:w-8 md:w-16 rounded-full transition-all ${
            tab === "shipping" || tab === "payment"
              ? "bg-green-500"
              : "bg-gray-200"
          }`}
        />

        {/* Step 2 - Shipping */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all ${
              tab === "shipping"
                ? "bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100"
                : tab === "payment"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {tab === "payment" ? (
              <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-xs font-medium ${
              tab === "shipping" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Shipping
          </span>
        </div>

        <div
          className={`h-0.5 w-6 sm:w-8 md:w-16 rounded-full transition-all ${
            tab === "payment" ? "bg-green-500" : "bg-gray-200"
          }`}
        />

        {/* Step 3 - Payment */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div
            className={`rounded-full font-semibold text-xs w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all ${
              tab === "payment"
                ? "bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span
            className={`text-[10px] sm:text-xs font-medium ${
              tab === "payment" ? "text-blue-600" : "text-slate-600"
            }`}
          >
            Payment
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {tab === "contact" && (
            <Card className="shadow-none">
              <CardHeader className="px-4 py-3 sm:p-6 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />{" "}
                    <span className="ml-2">Contact Information</span>
                  </div>
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm">
                  We'll use this to send you order updates and receipts.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                <ContactForm user={{ id: user.id, email: user.email || "" }} />

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    disabled
                    variant={"outline"}
                    className="order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={() => setTab("shipping")}
                    className="order-1 sm:order-2"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "shipping" && (
            <Card className="shadow-none">
              <CardHeader className="px-4 py-3 sm:p-6 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5" />{" "}
                    <span className="ml-2">Shipping Information</span>
                  </div>
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Enter your delivery address for fast & secure shipping.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                {/* Free Shipping Badge */}
                <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-green-700">
                      Free Shipping on this order!
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-green-600">
                      Estimated delivery: {deliveryDateStr}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 text-[9px] sm:text-[10px] shrink-0"
                  >
                    FREE
                  </Badge>
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label
                    htmlFor="fullName"
                    className="text-sm flex items-center gap-1"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    required
                    placeholder="Enter your full name"
                    value={shippingInfo.fullName}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-1.5 sm:gap-2">
                  <Label
                    htmlFor="address_line1"
                    className="text-sm flex items-center gap-1"
                  >
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address_line1"
                    required
                    placeholder="House/Flat No., Building, Street, Area"
                    value={shippingInfo.address_line1}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address_line1: e.target.value,
                      })
                    }
                    className="min-h-20 text-sm"
                  />
                </div>
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="address_line2" className="text-sm">
                    Landmark / Additional Info{" "}
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="address_line2"
                    placeholder="Near landmark, additional directions..."
                    value={shippingInfo.address_line2}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address_line2: e.target.value,
                      })
                    }
                    className="min-h-[60px] text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label
                      htmlFor="city"
                      className="text-sm flex items-center gap-1"
                    >
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      required
                      placeholder="Enter city"
                      value={shippingInfo.city}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label
                      htmlFor="postal_code"
                      className="text-sm flex items-center gap-1"
                    >
                      PIN Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postal_code"
                      required
                      placeholder="6-digit PIN code"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label
                      htmlFor="state"
                      className="text-sm flex items-center gap-1"
                    >
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      required
                      placeholder="Enter state"
                      value={shippingInfo.state}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label
                      htmlFor="country"
                      className="text-sm flex items-center gap-1"
                    >
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      required
                      placeholder="Enter country"
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

                {/* Secure Address Info */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 pt-1">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Your address is securely stored and never shared.</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab("contact")}
                    className="order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
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
                    className="order-1 sm:order-2"
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
              <CardHeader className="px-4 py-3 sm:p-6 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />{" "}
                    <span className="ml-2">Payment Information</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="grid gap-3 sm:gap-4">
                  <Label className="text-sm font-medium">Payment Method</Label>

                  {/* Payment Method Cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* COD Option */}
                    <button
                      type="button"
                      onClick={() => isCodAvailable && setPaymentMethod("cod")}
                      disabled={!isCodAvailable}
                      className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                        paymentMethod === "cod" && isCodAvailable
                          ? "border-blue-500 bg-blue-50"
                          : isCodAvailable
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {paymentMethod === "cod" && isCodAvailable && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                      )}
                      <Banknote
                        className={`h-5 w-5 sm:h-6 sm:w-6 mb-1.5 sm:mb-2 ${
                          isCodAvailable ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <p className="text-xs sm:text-sm font-medium">
                        Cash on Delivery
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
                        Pay when you receive
                      </p>
                      {!isCodAvailable && (
                        <Badge
                          variant="outline"
                          className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-amber-600 border-amber-200"
                        >
                          Not available
                        </Badge>
                      )}
                    </button>

                    {/* Online Payment Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                        paymentMethod === "online"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {paymentMethod === "online" && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                      )}
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 mb-1.5 sm:mb-2 text-blue-600" />
                      <p className="text-xs sm:text-sm font-medium">
                        Online Payment
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
                        Cards, UPI, Net Banking
                      </p>
                    </button>
                  </div>

                  {/* Payment Icons */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-2">
                    <span className="text-[10px] sm:text-xs text-slate-500">
                      We accept:
                    </span>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 rounded">
                        VISA
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 rounded">
                        Mastercard
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 rounded">
                        UPI
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 rounded">
                        RuPay
                      </span>
                    </div>
                  </div>

                  {/* COD Information */}
                  <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-amber-800">
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
                  <div className="space-y-4">
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">
                        <span className="font-semibold">Secure Checkout:</span>{" "}
                        You will be redirected to Cashfree's secure payment
                        gateway to complete your payment. All transactions are
                        encrypted and safe.
                      </p>
                    </div>
                  </div>
                )}

                {(error || cashfreeError) && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-700">
                      <span className="font-semibold">Error:</span>{" "}
                      {error || cashfreeError}
                    </p>
                  </div>
                )}

                {/* Order Review Accordion */}
                <Collapsible
                  open={orderReviewOpen}
                  onOpenChange={setOrderReviewOpen}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <span className="text-xs sm:text-sm font-medium">
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
                    <div className="p-2.5 sm:p-3 space-y-2 border border-t-0 rounded-b-lg">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-slate-600 shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t mt-2">
                        <p className="text-xs sm:text-sm font-semibold flex justify-between">
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
                <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-lg">
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
                    className="text-[10px] sm:text-xs text-slate-600 cursor-pointer"
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

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab("shipping")}
                    className="order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <form
                    onSubmit={handleSubmit}
                    className="inline order-1 sm:order-2"
                  >
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading || cashfreeLoading || !termsAccepted}
                      className="w-full sm:w-auto sm:min-w-[180px] h-11 sm:h-12 text-sm sm:text-base font-semibold"
                    >
                      {isLoading || cashfreeLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {paymentMethod === "online"
                            ? "Processing..."
                            : "Processing..."}
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
          <Card className="lg:sticky lg:top-20 shadow-none border-slate-200">
            <CardHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CardTitle className="text-xs sm:text-sm">
                    Order Summary
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-[9px] sm:text-[10px] px-1 sm:px-1.5"
                  >
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Badge>
                </div>
                <Link
                  href="/cart"
                  className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Edit
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 py-0 pb-3 sm:pb-4">
              {/* Products with hover */}
              <div className="space-y-2 sm:space-y-3 max-h-36 sm:max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3 group">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded overflow-hidden group-hover:ring-2 ring-blue-200 transition-all shrink-0">
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
                      <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] sm:text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        {currencySymbol}
                        {item.price.toLocaleString("en-IN")} each
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 shrink-0">
                      {currencySymbol}
                      {(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Estimated Delivery */}
              <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-blue-50 rounded-lg">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-900">
                    Estimated Delivery
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-blue-600 font-semibold">
                    {deliveryDateStr}
                  </p>
                </div>
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500 shrink-0" />
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600 font-medium bg-green-50 -mx-1.5 sm:-mx-2 px-1.5 sm:px-2 py-1 rounded">
                    <span className="flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="truncate">
                        Discount ({appliedCoupon?.code})
                      </span>
                    </span>
                    <span className="shrink-0">
                      -{currencySymbol}
                      {discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-bold text-slate-900 pt-1.5 sm:pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Savings Highlight */}
              {discount > 0 && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-green-700">
                    You're saving {currencySymbol}
                    {discount.toLocaleString("en-IN")} on this order!
                  </p>
                </div>
              )}

              {/* Order Protection Badge */}
              <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-slate-50 rounded-lg">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-900">
                    Order Protection
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                    Your order is protected & secure
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t">
                <div className="flex flex-col items-center text-center p-1.5 sm:p-2">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-[10px] text-slate-600">
                    Secure Pay
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-1.5 sm:p-2">
                  <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-[10px] text-slate-600">
                    Easy Return
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-1.5 sm:p-2">
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-[10px] text-slate-600">
                    Free Delivery
                  </span>
                </div>
              </div>

              {/* Customer Support */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1.5 sm:pt-2 border-t">
                <div className="flex items-center gap-1 text-slate-600">
                  <Headphones className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-[9px] sm:text-[10px]">
                    24/7 Support
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-[9px] sm:text-[10px]">
                    1800-XXX-XXXX
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-xs sm:text-sm text-red-500">{error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recently Viewed Products */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
        <RecentlyViewedProducts />
      </div>
    </div>
  );
}
