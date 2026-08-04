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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { State, City } from "country-state-city";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Banknote,
  Smartphone,
  Loader2,
  Tag,
  Gift,
  StickyNote,
  Trash2,
} from "lucide-react";
import ContactForm, { type ContactFormHandle } from "./contact-form";
import { RecentlyViewedProducts } from "./recently-viewed-products";
import { useCustomer } from "@/hooks/use-customer";
import { clientLogger } from "@/lib/client-logger";

const INDIA_CODE = "IN";
const LOG_SOURCE = "checkout-form";

export function CheckoutForm({ user }: { user: User }) {
  const { items, appliedCoupon } = useCart();
  const { getSetting } = useStoreSettings(["currency_symbol", "store_country"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGift, setIsGift] = useState(
    () => searchParams.get("isGift") === "true",
  );
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
    addresses: cachedAddresses,
    isHydrated,
    fetchCustomerData,
    saveAddress,
    deleteAddress,
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

  // Calculate total items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [tab, setTab] = useState<"contact" | "shipping" | "payment">("contact");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const contactFormRef = useRef<ContactFormHandle>(null);
  const hasLoggedPageView = useRef(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderReviewOpen, setOrderReviewOpen] = useState(true);
  const [cardNumber, setCardNumber] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [shippingInfo, setShippingInfo] = useState({
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

  // Saved address book (multiple addresses per customer)
  const [addressList, setAddressList] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<
    string | "new" | null
  >(null);
  // Id of the saved address currently being edited (null when not editing)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  // Id of the saved address currently being deleted (null when idle)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null,
  );
  // Id of the saved address pending confirmation for deletion (drives the
  // AlertDialog below; null means the dialog is closed)
  const [addressPendingDeletion, setAddressPendingDeletion] = useState<
    string | null
  >(null);

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingAddressId(addressId);
    try {
      const ok = await deleteAddress(addressId);
      if (!ok) throw new Error("Failed to delete address");

      clientLogger.info("Saved address deleted", {
        source: LOG_SOURCE,
        context: { addressId },
      });

      const refreshed = await fetchCustomerData(true);
      const newList = refreshed.addresses || [];
      setAddressList(newList);

      if (editingAddressId === addressId) {
        setEditingAddressId(null);
      }

      if (selectedAddressId === addressId) {
        const next = newList.find((a: any) => a.is_default) || newList[0];
        if (next) {
          setSelectedAddressId(next.id ?? null);
          setShippingInfo({
            address_line1: next.address_line1 || "",
            address_line2: next.address_line2 || "",
            city: next.city || "",
            state: next.state || "",
            postal_code: next.postal_code || "",
            country: next.country || defaultCountry,
          });
        } else {
          setSelectedAddressId("new");
          setShippingInfo({
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            postal_code: "",
            country: defaultCountry,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      clientLogger.error("Failed to delete saved address", {
        source: LOG_SOURCE,
        context: {
          addressId,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      alert("Failed to delete address. Please try again.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  // Gift recipient details (only relevant when isGift is true)
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: defaultCountry,
  });
  const [recipientCities, setRecipientCities] = useState<any[]>([]);
  const [notifyRecipient, setNotifyRecipient] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [hidePrices, setHidePrices] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);

  const giftWrapCharge = isGift && giftWrap ? 89 : 0;
  const total = subtotal + shipping - discount + giftWrapCharge;

  // COD orders require a 20% advance payment online (via Cashfree); the
  // remaining 80% is collected as cash on delivery. This mirrors the
  // server-side calculation in app/(site)/api/orders/route.ts, which is
  // the authoritative source — these client values are for display only.
  const ADVANCE_PERCENT = 0.2;
  const isCod = paymentMethod === "cod";
  const advanceAmount = isCod ? Math.round(total * ADVANCE_PERCENT) : total;
  const codDueAmount = isCod ? Math.round(total - advanceAmount) : 0;

  // Full name is always derived from the customer's first/last name
  // (collected in the Contact step) rather than a separate editable field.
  const fullName =
    `${customerInfo?.first_name || ""} ${customerInfo?.last_name || ""}`.trim();

  useEffect(() => {
    console.log("Shipping Info:", shippingInfo);
  }, [shippingInfo]);

  // Load Indian states on mount
  useEffect(() => {
    const indiaStates = State.getStatesOfCountry(INDIA_CODE);
    setStates(indiaStates || []);
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (shippingInfo.state) {
      const selectedState = states.find((s) => s.name === shippingInfo.state);
      if (selectedState) {
        const stateCities = City.getCitiesOfState(
          INDIA_CODE,
          selectedState.isoCode,
        );
        setCities(stateCities || []);
        // Reset city when state changes
        setShippingInfo((prev) => ({ ...prev, city: "" }));
      }
    }
  }, [shippingInfo.state, states]);

  // COD price limits
  const COD_MIN_AMOUNT = 599;
  const COD_MAX_AMOUNT = 9999;

  // Check if COD is available. Gift orders must be prepaid (online only).
  const isCodAvailable =
    !isGift &&
    appliedCoupon === null &&
    subtotal >= COD_MIN_AMOUNT &&
    subtotal <= COD_MAX_AMOUNT;

  // Switch to online payment if COD becomes unavailable
  useEffect(() => {
    if (!isCodAvailable && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [isCodAvailable, paymentMethod]);

  // Load cities for the recipient's delivery address when its state changes
  useEffect(() => {
    if (recipientAddress.state) {
      const selectedState = states.find(
        (s) => s.name === recipientAddress.state,
      );
      if (selectedState) {
        const stateCities = City.getCitiesOfState(
          INDIA_CODE,
          selectedState.isoCode,
        );
        setRecipientCities(stateCities || []);
        setRecipientAddress((prev) => ({ ...prev, city: "" }));
      }
    }
  }, [recipientAddress.state, states]);

  // Once the saved address list loads, auto-select the default address
  // (or the first one) and pre-fill the shipping form with it.
  useEffect(() => {
    if (selectedAddressId !== null) return;
    if (addressList.length > 0) {
      const defaultAddr =
        addressList.find((a) => a.is_default) || addressList[0];
      setSelectedAddressId(defaultAddr.id);
      setShippingInfo({
        address_line1: defaultAddr.address_line1 || "",
        address_line2: defaultAddr.address_line2 || "",
        city: defaultAddr.city || "",
        state: defaultAddr.state || "",
        postal_code: defaultAddr.postal_code || "",
        country: defaultAddr.country || defaultCountry,
      });
    }
  }, [addressList, selectedAddressId, defaultCountry]);

  // Use cached customer data or fetch if needed
  useEffect(() => {
    if (!isHydrated) return;

    const loadCustomerData = async () => {
      // Use cache if valid
      if (isCacheValid() && cachedCustomer?.user_id === user.id) {
        setCustomerInfo({
          first_name: cachedCustomer.first_name || "",
          last_name: cachedCustomer.last_name || "",
          phone: cachedCustomer.phone || "",
        });

        setAddressList(
          cachedAddresses && cachedAddresses.length > 0
            ? cachedAddresses
            : cachedAddress
              ? [cachedAddress]
              : [],
        );
        return;
      }

      // Fetch from API if cache is invalid
      const { customer, address, addresses } = await fetchCustomerData();

      if (customer) {
        setCustomerInfo({
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          phone: customer.phone || "",
        });
      }

      setAddressList(
        addresses && addresses.length > 0
          ? addresses
          : address
            ? [address]
            : [],
      );
    };

    loadCustomerData();
  }, [isHydrated, user.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Pre-validate phone BEFORE creating an order to avoid leaving ghost
    // "pending" orders in the DB. Both COD (20% advance) and online (full
    // amount) payments now go through Cashfree, so both need a valid phone.
    if (paymentMethod === "online" || paymentMethod === "cod") {
      const rawPhone = (customerInfo?.phone || "").trim();
      const normalized = rawPhone.replace(/[\s()-]/g, "");
      const isValidPhone = /^(\+\d{10,15}|\d{10,15})$/.test(normalized);
      if (!isValidPhone) {
        setIsLoading(false);
        clientLogger.warn("Checkout blocked: invalid phone number", {
          source: LOG_SOURCE,
          context: { paymentMethod },
        });
        setError(
          "A valid phone number is required for payment. Please update your contact details.",
        );
        setTab("contact");
        return;
      }
    }

    clientLogger.info("Placing order", {
      source: LOG_SOURCE,
      context: {
        paymentMethod,
        isGift,
        itemCount: totalItems,
        total,
        couponApplied: Boolean(appliedCoupon),
      },
    });

    try {
      // Step 1: Create order in database
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Customer information
          user_id: user.id,
          total,
          // Every order now requires an online payment step before it's
          // confirmed — the full amount for "online", or a 20% advance for
          // "cod" (remaining 80% collected on delivery). Orders start as
          // "pending" and only move to "processing" once the Cashfree
          // webhook confirms that payment succeeded.
          status: "pending",

          // Customer information
          customer_name: fullName,
          customer_email: user.email,
          customer_phone: customerInfo?.phone || null,

          // Shipping address details (flattened to match schema).
          // For gift orders, ship to the recipient instead of the buyer.
          shipping_address: isGift
            ? `${recipientAddress.address_line1}${
                recipientAddress.address_line2
                  ? ", " + recipientAddress.address_line2
                  : ""
              }, ${recipientAddress.state}`
            : `${shippingInfo.address_line1}${
                shippingInfo.address_line2
                  ? ", " + shippingInfo.address_line2
                  : ""
              }, ${shippingInfo.state}`, // Added state to address
          shipping_city: isGift ? recipientAddress.city : shippingInfo.city,
          shipping_postal_code: isGift
            ? recipientAddress.postal_code
            : shippingInfo.postal_code,
          shipping_country: isGift
            ? recipientAddress.country
            : shippingInfo.country,

          // Coupon and discount information
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discount || 0,

          // Order items for order_items table
          order_items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),

          // Gift details (only meaningful when isGift is true)
          is_gift: isGift,
          recipient_name: isGift ? recipientName : null,
          recipient_phone: isGift ? recipientPhone : null,
          notify_recipient: isGift ? notifyRecipient : false,
          gift_message: isGift ? giftMessage.slice(0, 300) : null,
          hide_prices: isGift ? hidePrices : false,
          gift_wrap: isGift ? giftWrap : false,

          // Delivery instructions for the courier (optional)
          delivery_notes: deliveryNotes.trim().slice(0, 300) || null,

          // Additional metadata
          metadata: {
            payment_method: paymentMethod,
            shipping_state: isGift
              ? recipientAddress.state
              : shippingInfo.state,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        clientLogger.error("Order creation failed", {
          source: LOG_SOURCE,
          context: {
            status: orderResponse.status,
            error: errorData.message || "Unknown error",
          },
        });
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.orderId;

      if (!orderId) {
        clientLogger.error("Order created but no orderId returned", {
          source: LOG_SOURCE,
        });
        throw new Error("Order created but no ID returned");
      }

      clientLogger.info("Order created successfully", {
        source: LOG_SOURCE,
        context: { orderId, paymentMethod, isGift, total },
      });

      // Step 2: Handle payment via Cashfree. COD orders only charge the 20%
      // advance now; online orders charge the full amount. Either way, the
      // order is NOT confirmed until this payment succeeds.
      const phoneNumber = customerInfo?.phone?.trim() || "";

      if (!phoneNumber) {
        clientLogger.error(
          "Payment blocked: missing phone number after order creation",
          {
            source: LOG_SOURCE,
            context: { orderId },
          },
        );
        throw new Error("Phone number is required for payment");
      }

      // Stash orderId so /checkout/payment-callback can recover it if
      // Cashfree doesn't append order_id back to the return URL.
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("pending_order_id", orderId);
        } catch {
          /* ignore */
        }
      }

      try {
        clientLogger.info("Initiating payment", {
          source: LOG_SOURCE,
          context: {
            orderId,
            amount: isCod ? advanceAmount : total,
            paymentMethod,
          },
        });

        await initiateCashfreePayment({
          orderId,
          amount: isCod ? advanceAmount : total,
          customerEmail: user.email || "",
          customerPhone: phoneNumber,
          customerName: fullName,
        });

        // With redirectTarget=_self the line below is rarely reached
        // because Cashfree navigates the user away. Kept as a safety net.
        setOrderPlaced(true);
      } catch (paymentError) {
        clientLogger.error("Payment initiation failed", {
          source: LOG_SOURCE,
          context: {
            orderId,
            error:
              paymentError instanceof Error
                ? paymentError.message
                : String(paymentError),
          },
        });

        // Payment session creation / SDK failure: mark order cancelled to
        // prevent ghost pending orders.
        try {
          await fetch(`/api/orders/${orderId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: "payment_initiation_failed",
            }),
          });
          clientLogger.warn("Order auto-cancelled after payment failure", {
            source: LOG_SOURCE,
            context: { orderId },
          });
        } catch (cancelError) {
          clientLogger.error(
            "Failed to auto-cancel order after payment failure",
            {
              source: LOG_SOURCE,
              context: {
                orderId,
                error:
                  cancelError instanceof Error
                    ? cancelError.message
                    : String(cancelError),
              },
            },
          );
        }

        setError(
          paymentError instanceof Error
            ? paymentError.message
            : "Payment failed. Please try again.",
        );
      }
    } catch (error) {
      clientLogger.error("Checkout failed", {
        source: LOG_SOURCE,
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Log once that the checkout page was opened with items in the cart.
  useEffect(() => {
    if (hasLoggedPageView.current || items.length === 0) return;
    hasLoggedPageView.current = true;
    clientLogger.info("Checkout page viewed", {
      source: LOG_SOURCE,
      context: { itemCount: totalItems, total, isGift },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Redirect to cart if empty (must be in useEffect to avoid render-time state updates)
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      clientLogger.info(
        "Redirected to cart: checkout opened with an empty cart",
        { source: LOG_SOURCE },
      );
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
                <ContactForm ref={contactFormRef} user={{ id: user.id }} />

                <label
                  htmlFor="is-gift-checkout"
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
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
                    id="is-gift-checkout"
                    checked={isGift}
                    onCheckedChange={(checked) => {
                      const nextIsGift = checked === true;
                      setIsGift(nextIsGift);
                      clientLogger.info("Gift option toggled at checkout", {
                        source: LOG_SOURCE,
                        context: { isGift: nextIsGift },
                      });
                    }}
                    className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                  />
                </label>

                {isGift && (
                  <div className="space-y-4 rounded-lg border border-pink-200 bg-pink-50/40 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-pink-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Gift Recipient Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="recipient_name"
                          className="text-sm flex items-center gap-1"
                        >
                          Recipient Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="recipient_name"
                          required
                          placeholder="Who is this gift for?"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="recipient_phone"
                          className="text-sm flex items-center gap-1"
                        >
                          Recipient Phone{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="recipient_phone"
                          required
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit phone number"
                          value={recipientPhone}
                          onChange={(e) =>
                            setRecipientPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="recipient_address_line1"
                        className="text-sm flex items-center gap-1"
                      >
                        Recipient Delivery Address{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="recipient_address_line1"
                        required
                        placeholder="House/Flat No., Building, Street, Area"
                        value={recipientAddress.address_line1}
                        onChange={(e) =>
                          setRecipientAddress({
                            ...recipientAddress,
                            address_line1: e.target.value,
                          })
                        }
                        className="min-h-20 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="recipient_address_line2"
                        className="text-sm"
                      >
                        Landmark / Additional Info{" "}
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          (Optional)
                        </span>
                      </Label>
                      <Textarea
                        id="recipient_address_line2"
                        placeholder="Near landmark, additional directions..."
                        value={recipientAddress.address_line2}
                        onChange={(e) =>
                          setRecipientAddress({
                            ...recipientAddress,
                            address_line2: e.target.value,
                          })
                        }
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="recipient_state"
                          className="text-sm flex items-center gap-1"
                        >
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={recipientAddress.state}
                          onValueChange={(value) =>
                            setRecipientAddress({
                              ...recipientAddress,
                              state: value,
                              city: "",
                            })
                          }
                        >
                          <SelectTrigger
                            id="recipient_state"
                            className="w-full"
                          >
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((state) => (
                              <SelectItem
                                key={state.isoCode}
                                value={state.name}
                              >
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="recipient_country"
                          className="text-sm flex items-center gap-1"
                        >
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="recipient_country"
                          required
                          value="India"
                          disabled
                        />
                      </div>
                    </div>
                    {recipientAddress.state && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="recipient_city"
                            className="text-sm flex items-center gap-1"
                          >
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={recipientAddress.city}
                            onValueChange={(value) =>
                              setRecipientAddress({
                                ...recipientAddress,
                                city: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id="recipient_city"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipientCities.map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="recipient_postal_code"
                            className="text-sm flex items-center gap-1"
                          >
                            PIN Code <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="recipient_postal_code"
                            required
                            placeholder="6-digit PIN code"
                            value={recipientAddress.postal_code}
                            onChange={(e) =>
                              setRecipientAddress({
                                ...recipientAddress,
                                postal_code: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <label
                      htmlFor="notify_recipient"
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <Checkbox
                        id="notify_recipient"
                        checked={notifyRecipient}
                        onCheckedChange={(checked) =>
                          setNotifyRecipient(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="text-xs sm:text-sm text-slate-700">
                        Notify recipient about this gift order
                      </span>
                    </label>

                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gift_message" className="text-sm">
                          Gift Message{" "}
                          <span className="text-[10px] sm:text-xs text-slate-400">
                            (Optional)
                          </span>
                        </Label>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          {giftMessage.length}/300
                        </span>
                      </div>
                      <Textarea
                        id="gift_message"
                        placeholder="Write a short message for the recipient..."
                        value={giftMessage}
                        onChange={(e) =>
                          setGiftMessage(e.target.value.slice(0, 300))
                        }
                        maxLength={300}
                        className="min-h-20 text-sm"
                      />
                    </div>

                    <label
                      htmlFor="hide_prices"
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <Checkbox
                        id="hide_prices"
                        checked={hidePrices}
                        onCheckedChange={(checked) =>
                          setHidePrices(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="text-xs sm:text-sm text-slate-700">
                        Hide prices on the recipient's packing slip
                      </span>
                    </label>

                    <label
                      htmlFor="gift_wrap"
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
                        giftWrap
                          ? "border-pink-300 bg-pink-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Checkbox
                        id="gift_wrap"
                        checked={giftWrap}
                        onCheckedChange={(checked) =>
                          setGiftWrap(checked === true)
                        }
                        className="mt-0.5 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                      />
                      <span className="text-xs sm:text-sm text-slate-700">
                        Gift wrap this order{" "}
                        <span className="font-medium text-pink-600">
                          (+{currencySymbol}89)
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    disabled
                    variant={"outline"}
                    className="order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={async () => {
                      if (isSavingContact) return;

                      if (isGift) {
                        if (
                          !recipientName.trim() ||
                          !recipientAddress.address_line1.trim() ||
                          !recipientAddress.city ||
                          !recipientAddress.state ||
                          !recipientAddress.postal_code.trim()
                        ) {
                          clientLogger.warn(
                            "Checkout contact step blocked: incomplete gift recipient details",
                            { source: LOG_SOURCE },
                          );
                          alert(
                            "Please fill in all required recipient details.",
                          );
                          return;
                        }
                        if (recipientPhone.length !== 10) {
                          clientLogger.warn(
                            "Checkout contact step blocked: invalid recipient phone",
                            { source: LOG_SOURCE },
                          );
                          alert(
                            "Recipient phone number must be exactly 10 digits.",
                          );
                          return;
                        }
                      }

                      setIsSavingContact(true);
                      const ok =
                        (await contactFormRef.current?.save()) ?? false;
                      setIsSavingContact(false);
                      if (ok) {
                        setTab(isGift ? "payment" : "shipping");
                      } else {
                        clientLogger.warn(
                          "Checkout contact step blocked: contact form save failed",
                          { source: LOG_SOURCE },
                        );
                      }
                    }}
                    disabled={isSavingContact}
                    className="order-1 sm:order-2"
                  >
                    {isSavingContact ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Continue"
                    )}
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
                {addressList.length > 0 && (
                  <div className="space-y-2">
                    {addressList.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (editingAddressId) return;
                          setSelectedAddressId(addr.id);
                          setShippingInfo({
                            address_line1: addr.address_line1 || "",
                            address_line2: addr.address_line2 || "",
                            city: addr.city || "",
                            state: addr.state || "",
                            postal_code: addr.postal_code || "",
                            country: addr.country || defaultCountry,
                          });
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedAddressId === addr.id &&
                          editingAddressId !== addr.id
                            ? "border-blue-500 bg-blue-50"
                            : editingAddressId === addr.id
                              ? "border-amber-400 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5">
                              {addr.full_name}
                              {addr.is_default && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5"
                                >
                                  Default
                                </Badge>
                              )}
                              {editingAddressId === addr.id && (
                                <Badge className="text-[9px] px-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
                                  Editing
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {addr.address_line1}
                              {addr.address_line2
                                ? `, ${addr.address_line2}`
                                : ""}
                              , {addr.city}, {addr.state} {addr.postal_code}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAddressId(addr.id);
                                setEditingAddressId(addr.id);
                                setShippingInfo({
                                  address_line1: addr.address_line1 || "",
                                  address_line2: addr.address_line2 || "",
                                  city: addr.city || "",
                                  state: addr.state || "",
                                  postal_code: addr.postal_code || "",
                                  country: addr.country || defaultCountry,
                                });
                              }}
                              disabled={deletingAddressId === addr.id}
                              className="p-1 hover:bg-white/60 rounded transition-colors disabled:opacity-50"
                              title="Edit address"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddressPendingDeletion(addr.id);
                              }}
                              disabled={deletingAddressId === addr.id}
                              className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete address"
                            >
                              {deletingAddressId === addr.id ? (
                                <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                              )}
                            </button>
                            {selectedAddressId === addr.id &&
                              editingAddressId !== addr.id && (
                                <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setSelectedAddressId("new");
                        setShippingInfo({
                          address_line1: "",
                          address_line2: "",
                          city: "",
                          state: "",
                          postal_code: "",
                          country: defaultCountry,
                        });
                      }}
                      className={`w-full text-left p-3 rounded-lg border-2 border-dashed transition-all ${
                        selectedAddressId === "new" && !editingAddressId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium text-blue-600">
                        + Add a new address
                      </span>
                    </button>
                  </div>
                )}

                {(selectedAddressId === "new" ||
                  addressList.length === 0 ||
                  editingAddressId) && (
                  <>
                    {editingAddressId && (
                      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <span className="text-xs sm:text-sm text-amber-800 font-medium">
                          Editing saved address
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultAddr =
                              addressList.find((a) => a.is_default) ||
                              addressList[0];
                            setEditingAddressId(null);
                            if (defaultAddr) {
                              setSelectedAddressId(defaultAddr.id);
                              setShippingInfo({
                                address_line1: defaultAddr.address_line1 || "",
                                address_line2: defaultAddr.address_line2 || "",
                                city: defaultAddr.city || "",
                                state: defaultAddr.state || "",
                                postal_code: defaultAddr.postal_code || "",
                                country: defaultAddr.country || defaultCountry,
                              });
                            }
                          }}
                          className="text-xs sm:text-sm text-amber-700 underline hover:text-amber-900"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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
                          htmlFor="state"
                          className="text-sm flex items-center gap-1"
                        >
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={shippingInfo.state}
                          onValueChange={(value) =>
                            setShippingInfo({
                              ...shippingInfo,
                              state: value,
                              city: "",
                            })
                          }
                        >
                          <SelectTrigger id="state" className="w-full">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((state) => (
                              <SelectItem
                                key={state.isoCode}
                                value={state.name}
                              >
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          value="India"
                          disabled
                        />
                      </div>
                    </div>
                    {shippingInfo.state && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="grid gap-1.5 sm:gap-2">
                          <Label
                            htmlFor="city"
                            className="text-sm flex items-center gap-1"
                          >
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={shippingInfo.city}
                            onValueChange={(value) =>
                              setShippingInfo({
                                ...shippingInfo,
                                city: value,
                              })
                            }
                          >
                            <SelectTrigger id="city" className="w-full">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    )}
                  </>
                )}

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
                      if (editingAddressId) {
                        if (
                          !fullName ||
                          !shippingInfo.address_line1 ||
                          !shippingInfo.city ||
                          !shippingInfo.state ||
                          !shippingInfo.postal_code ||
                          !shippingInfo.country
                        ) {
                          clientLogger.warn(
                            "Checkout shipping step blocked: incomplete address fields",
                            { source: LOG_SOURCE, context: { editing: true } },
                          );
                          alert("Please fill in all required shipping fields.");
                          return;
                        }

                        try {
                          setIsLoading(true);
                          const result = await saveAddress({
                            id: editingAddressId,
                            full_name: fullName,
                            address_line1: shippingInfo.address_line1,
                            address_line2: shippingInfo.address_line2,
                            city: shippingInfo.city,
                            state: shippingInfo.state,
                            postal_code: shippingInfo.postal_code,
                            country: shippingInfo.country,
                          });

                          if (!result) {
                            throw new Error("Failed to update address");
                          }

                          clientLogger.info("Saved address updated", {
                            source: LOG_SOURCE,
                            context: { addressId: editingAddressId },
                          });

                          const refreshed = await fetchCustomerData(true);
                          setAddressList(
                            refreshed.addresses &&
                              refreshed.addresses.length > 0
                              ? refreshed.addresses
                              : [result],
                          );
                          setSelectedAddressId(result.id);
                          setEditingAddressId(null);

                          setTab("payment");
                        } catch (error) {
                          console.error("Error updating address:", error);
                          clientLogger.error("Failed to update saved address", {
                            source: LOG_SOURCE,
                            context: {
                              addressId: editingAddressId,
                              error:
                                error instanceof Error
                                  ? error.message
                                  : String(error),
                            },
                          });
                          alert("Failed to update address. Please try again.");
                        } finally {
                          setIsLoading(false);
                        }
                        return;
                      }

                      if (selectedAddressId && selectedAddressId !== "new") {
                        // Reusing an already-saved address, nothing new to persist
                        setTab("payment");
                        return;
                      }

                      if (addressList.length > 0 && !selectedAddressId) {
                        clientLogger.warn(
                          "Checkout shipping step blocked: no address selected",
                          { source: LOG_SOURCE },
                        );
                        alert(
                          "Please select a saved address or add a new one to continue.",
                        );
                        return;
                      }

                      if (
                        !fullName ||
                        !shippingInfo.address_line1 ||
                        !shippingInfo.city ||
                        !shippingInfo.state ||
                        !shippingInfo.postal_code ||
                        !shippingInfo.country
                      ) {
                        clientLogger.warn(
                          "Checkout shipping step blocked: incomplete address fields",
                          { source: LOG_SOURCE, context: { editing: false } },
                        );
                        alert("Please fill in all required shipping fields.");
                        return;
                      }

                      // Save this as a brand-new address (updates cache automatically)
                      try {
                        setIsLoading(true);
                        const result = await saveAddress({
                          full_name: fullName,
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

                        clientLogger.info("New address saved at checkout", {
                          source: LOG_SOURCE,
                          context: { addressId: result.id },
                        });

                        const refreshed = await fetchCustomerData(true);
                        setAddressList(
                          refreshed.addresses && refreshed.addresses.length > 0
                            ? refreshed.addresses
                            : [result],
                        );
                        setSelectedAddressId(result.id);

                        setTab("payment");
                      } catch (error) {
                        console.error("Error saving address:", error);
                        clientLogger.error("Failed to save new address", {
                          source: LOG_SOURCE,
                          context: {
                            error:
                              error instanceof Error
                                ? error.message
                                : String(error),
                          },
                        });
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
                      onClick={() => {
                        if (!isCodAvailable) return;
                        setPaymentMethod("cod");
                        clientLogger.info("Payment method selected", {
                          source: LOG_SOURCE,
                          context: { paymentMethod: "cod" },
                        });
                      }}
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
                        Pay 20% now, rest on delivery
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
                      onClick={() => {
                        setPaymentMethod("online");
                        clientLogger.info("Payment method selected", {
                          source: LOG_SOURCE,
                          context: { paymentMethod: "online" },
                        });
                      }}
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
                      {isGift
                        ? "Not available for gift orders — gift orders must be paid online."
                        : `Available only for orders between ₹${COD_MIN_AMOUNT} and ₹${COD_MAX_AMOUNT.toLocaleString()} without any coupon applied. A 20% advance payment is required online to confirm the order.`}
                    </p>
                  </div>

                  {isCod && isCodAvailable && (
                    <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-blue-800">
                        <span className="font-semibold">Pay in two parts:</span>{" "}
                        {currencySymbol}
                        {advanceAmount.toLocaleString("en-IN")} (20%) online now
                        to confirm your order, and the remaining{" "}
                        {currencySymbol}
                        {codDueAmount.toLocaleString("en-IN")} (80%) in cash on
                        delivery.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <span className="font-semibold">Secure Checkout:</span>{" "}
                      You will be redirected to Cashfree's secure payment
                      gateway to complete your {isCod ? "advance " : ""}
                      payment. All transactions are encrypted and safe.
                    </p>
                  </div>
                  {/* <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-amber-800">
                      <span className="font-semibold">
                        Cancellation Policy:
                      </span>{" "}
                      After the order is dispatched, a 50% cancellation penalty
                      applies on advance (prepaid) payments.
                    </p>
                  </div> */}
                </div>

                {(error || cashfreeError) && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-700">
                      <span className="font-semibold">Error:</span>{" "}
                      {error || cashfreeError}
                    </p>
                  </div>
                )}

                {/* Delivery Notes */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="delivery_notes"
                      className="text-sm flex items-center gap-1.5"
                    >
                      <StickyNote className="h-3.5 w-3.5 text-slate-500" />
                      Delivery Notes{" "}
                      <span className="text-[10px] sm:text-xs text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </Label>
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      {deliveryNotes.length}/300
                    </span>
                  </div>
                  <Textarea
                    id="delivery_notes"
                    placeholder="e.g. Leave at the doorstep, call before delivery, nearby landmark..."
                    value={deliveryNotes}
                    onChange={(e) =>
                      setDeliveryNotes(e.target.value.slice(0, 300))
                    }
                    maxLength={300}
                    className="min-h-16 text-sm"
                  />
                </div>

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
                      <div className="pt-2 border-t mt-2 space-y-1">
                        {giftWrapCharge > 0 && (
                          <p className="text-xs sm:text-sm flex justify-between text-slate-600">
                            <span className="flex items-center gap-1">
                              <Gift className="h-3 w-3 text-pink-500" />
                              Gift Wrap
                            </span>
                            <span>
                              {currencySymbol}
                              {giftWrapCharge}
                            </span>
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-semibold flex justify-between">
                          <span>Total:</span>
                          <span>
                            {currencySymbol}
                            {total.toLocaleString("en-IN")}
                          </span>
                        </p>
                        {isCod && (
                          <>
                            <p className="text-xs sm:text-sm flex justify-between text-blue-700">
                              <span>Pay Online Now (20%):</span>
                              <span>
                                {currencySymbol}
                                {advanceAmount.toLocaleString("en-IN")}
                              </span>
                            </p>
                            <p className="text-xs sm:text-sm flex justify-between text-slate-600">
                              <span>Due on Delivery (80%):</span>
                              <span>
                                {currencySymbol}
                                {codDueAmount.toLocaleString("en-IN")}
                              </span>
                            </p>
                          </>
                        )}
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
                      href="/policies/terms-and-conditions"
                      className="text-blue-600 hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/policies/privacy-policy"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    variant={"outline"}
                    onClick={() => setTab(isGift ? "contact" : "shipping")}
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Pay {currencySymbol}
                          {(isCod ? advanceAmount : total).toLocaleString(
                            "en-IN",
                          )}
                          {isCod ? " Now" : ""}
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
                {giftWrapCharge > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pink-500" />
                      Gift Wrap
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {giftWrapCharge}
                    </span>
                  </div>
                )}
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
                {isCod && (
                  <>
                    <div className="flex justify-between text-xs sm:text-sm text-blue-700 font-medium">
                      <span>Pay Online Now (20%)</span>
                      <span>
                        {currencySymbol}
                        {advanceAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                      <span>Due on Delivery (80%)</span>
                      <span>
                        {currencySymbol}
                        {codDueAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}
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
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-[10px] text-slate-600">
                    Free Delivery
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

      {/* Delete saved address confirmation */}
      <AlertDialog
        open={addressPendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) setAddressPendingDeletion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This saved address will be permanently removed from your account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={() => {
                if (addressPendingDeletion) {
                  handleDeleteAddress(addressPendingDeletion);
                }
                setAddressPendingDeletion(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
