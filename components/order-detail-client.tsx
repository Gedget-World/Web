"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import {
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  ExternalLink,
  Phone,
  Mail,
  Bell,
  BellOff,
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  Tag,
  AlertCircle,
  PackageCheck,
  Home,
  X,
  Sparkles,
  PartyPopper,
  QrCode,
  Receipt,
  Clock3,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  Headphones,
  StickyNote,
  Pencil,
  Loader2,
  Save,
  Gift,
} from "lucide-react";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { OrderItemReview } from "@/components/order-item-review";

interface OrderDetailClientProps {
  order: any;
  statusHistory: any[];
  currencySymbol: string;
  userId: string;
}

export function OrderDetailClient({
  order,
  statusHistory,
  currencySymbol,
  userId,
}: OrderDetailClientProps) {
  const { toast } = useToast();
  const { addItem } = useCart();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiItems, setConfettiItems] = useState<
    Array<{
      id: number;
      left: number;
      delay: number;
      duration: number;
      color: string;
      shape: string;
    }>
  >([]);
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    order.delivery_notes || "",
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(deliveryNotes);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const canEditNotes = ["pending", "processing"].includes(order.status);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Confetti for delivered orders
  useEffect(() => {
    if (order.status === "delivered" && !isLoading) {
      // Generate confetti items only once
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2,
        color: [
          "bg-green-500",
          "bg-yellow-500",
          "bg-pink-500",
          "bg-blue-500",
          "bg-purple-500",
        ][Math.floor(Math.random() * 5)],
        shape: Math.random() > 0.5 ? "rounded-full" : "rotate-45",
      }));
      setConfettiItems(items);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [order.status, isLoading]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        setIsSticky(window.scrollY > 200);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animated timeline on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimelineVisible(true);
          }
        });
      },
      { threshold: 0.2 },
    );
    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const copyToClipboard = async (
    text: string,
    type: "id" | "address" | "tracking",
  ) => {
    await navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === "address") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
    toast({
      title: "Copied!",
      description: `${type === "id" ? "Order ID" : type === "address" ? "Address" : "Tracking number"} copied to clipboard`,
    });
  };

  const handleSaveDeliveryNotes = async () => {
    const trimmed = notesDraft.trim().slice(0, 300);
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/delivery-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_notes: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update delivery notes");
      }

      setDeliveryNotes(trimmed);
      setIsEditingNotes(false);
      toast({
        title: "Delivery notes updated",
        description: "Your delivery instructions have been saved.",
      });
    } catch (error) {
      toast({
        title: "Couldn't save delivery notes",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleBuyAgain = (item: any) => {
    if (item.products) {
      addItem({
        id: item.products.id,
        name: item.products.name,
        price: item.price,
        image_url: item.products.image_url,
        stock: 999, // Assume available
      });
      toast({
        title: "Added to cart!",
        description: `${item.products.name} has been added to your cart`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "from-amber-500 to-orange-500",
      processing: "from-blue-500 to-indigo-500",
      shipped: "from-purple-500 to-pink-500",
      delivered: "from-green-500 to-emerald-500",
      cancelled: "from-red-500 to-rose-500",
    };
    return colors[status] || colors.pending;
  };

  const getStatusBgColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200",
      shipped: "bg-purple-100 text-purple-700 border-purple-200",
      delivered: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      processing: <Package className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      delivered: <CheckCircle2 className="h-4 w-4" />,
      cancelled: <X className="h-4 w-4" />,
    };
    return icons[status] || icons.pending;
  };

  const getEstimatedDelivery = () => {
    const orderDate = new Date(order.created_at);
    const deliveryDate = new Date(orderDate);
    switch (order.status) {
      case "pending":
        deliveryDate.setDate(orderDate.getDate() + 7);
        break;
      case "processing":
        deliveryDate.setDate(orderDate.getDate() + 5);
        break;
      case "shipped":
        deliveryDate.setDate(orderDate.getDate() + 3);
        break;
      case "delivered":
        return null;
      default:
        deliveryDate.setDate(orderDate.getDate() + 7);
    }
    return deliveryDate;
  };

  const getPaymentMethodLabel = () => {
    const method = (order.payment_method || "").toString().toLowerCase();
    if (!method) return "Not specified";
    if (method === "cod") return "Cash on Delivery";
    if (method === "online") return "Online Payment";
    if (method.includes("upi")) return "UPI";
    if (method.includes("card")) return "Card";
    if (method.includes("netbanking") || method.includes("net_banking"))
      return "Net Banking";
    if (method.includes("wallet")) return "Wallet";
    return order.payment_method;
  };

  const getPaymentMethodIcon = () => {
    const method = (order.payment_method || "").toString().toLowerCase();
    if (method === "cod") return <Banknote className="h-4 w-4" />;
    if (method.includes("wallet")) return <Wallet className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  const calculateSavings = (item: any) => {
    // If original_price exists and is different from price
    if (item.original_price && item.original_price > item.price) {
      return (item.original_price - item.price) * item.quantity;
    }
    return 0;
  };

  const totalSavings = order.order_items.reduce(
    (acc: number, item: any) => acc + calculateSavings(item),
    0,
  );

  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(order.status);
  const estimatedDelivery = getEstimatedDelivery();

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  const isGift = Boolean(order.is_gift);

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen ${
          isGift
            ? "bg-linear-to-b from-pink-50 via-purple-50/30 to-white"
            : "bg-linear-to-b from-emerald-50 via-teal-50/30 to-white"
        }`}
      >
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiItems.map((item) => (
              <div
                key={item.id}
                className="absolute animate-confetti"
                style={{
                  left: `${item.left}%`,
                  top: `-10%`,
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.duration}s`,
                }}
              >
                <div className={`w-3 h-3 ${item.color} ${item.shape}`} />
              </div>
            ))}
          </div>
        )}

        {/* Sticky Header */}
        {isSticky && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm animate-in slide-in-from-top duration-300">
            <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusBgColor(order.status)} border`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
                <span className="text-sm font-medium text-slate-700">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="container max-w-4xl mx-auto py-8 px-4 md:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link
              href="/"
              className="hover:text-slate-900 flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/orders" className="hover:text-slate-900">
              Orders
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-900 font-medium">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </nav>

          {/* Gradient Hero Banner */}
          <div
            ref={headerRef}
            className={`relative overflow-hidden rounded-2xl bg-linear-to-r ${getStatusColor(order.status)} p-6 md:p-8 mb-8 text-white shadow-lg animate-in fade-in zoom-in-95 duration-500`}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                    {order.status === "delivered" ? (
                      <PartyPopper className="h-5 w-5" />
                    ) : (
                      getStatusIcon(order.status)
                    )}
                    <span className="font-semibold capitalize">
                      {order.status === "delivered"
                        ? "Order Delivered! 🎉"
                        : `Order ${order.status}`}
                    </span>
                  </div>

                  {/* Order ID with Copy */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                          onClick={() => copyToClipboard(order.id, "id")}
                        >
                          {copiedId ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copiedId ? "Copied!" : "Copy Order ID"}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <p className="text-white/80 text-sm">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {/* Estimated Delivery */}
                  {estimatedDelivery && order.status !== "cancelled" && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-sm">
                        Estimated delivery:{" "}
                        <strong>
                          {estimatedDelivery.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <CancelOrderButton orderId={order.id} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Progress Timeline - Desktop */}
          {order.status !== "cancelled" && (
            <Card className="mb-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <CardContent className="p-6">
                {/* Desktop Timeline */}
                <div className="hidden md:block">
                  <div className="relative">
                    {/* Background line */}
                    <div className="absolute top-5 left-0 right-0 h-1.5 bg-slate-200 rounded-full" />
                    {/* Animated Progress line */}
                    <div
                      className={`absolute top-5 left-0 h-1.5 bg-linear-to-r ${getStatusColor(order.status)} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        width: `${(currentIndex / 3) * 100}%`,
                      }}
                    >
                      {/* Pulse effect */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white animate-ping" />
                    </div>
                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {statusOrder.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const stepHistory = statusHistory?.find(
                          (h) => h.status === step,
                        );

                        return (
                          <Tooltip key={step}>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center cursor-pointer group">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                                    isCompleted
                                      ? `bg-linear-to-r ${getStatusColor(step)} text-white shadow-lg`
                                      : "bg-slate-200 text-slate-400"
                                  } ${
                                    isCurrent
                                      ? "ring-4 ring-offset-2 ring-offset-white ring-current scale-110"
                                      : ""
                                  } group-hover:scale-105`}
                                >
                                  {getStatusIcon(step)}
                                </div>
                                <span
                                  className={`text-xs mt-3 font-medium whitespace-nowrap transition-colors ${
                                    isCompleted
                                      ? "text-slate-900"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {step.charAt(0).toUpperCase() + step.slice(1)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="text-center">
                                <p className="font-medium capitalize">{step}</p>
                                {stepHistory ? (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(
                                      stepHistory.created_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {isCompleted ? "Completed" : "Pending"}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile Vertical Timeline */}
                <div className="md:hidden">
                  <div className="relative pl-10">
                    {/* Vertical line background */}
                    <div className="absolute left-3.5 top-4 bottom-4 w-[3px] bg-slate-200 rounded-full" />
                    {/* Animated Progress line */}
                    <div
                      className={`absolute left-3.5 top-4 w-[3px] bg-linear-to-b ${getStatusColor(order.status)} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        height:
                          currentIndex === 0
                            ? "1.5rem"
                            : currentIndex === statusOrder.length - 1
                              ? "calc(100% - 2rem)"
                              : `calc(${(currentIndex / (statusOrder.length - 1)) * 100}% - 1rem + 1.5rem)`,
                      }}
                    ></div>

                    <div className="space-y-5">
                      {statusOrder.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const stepHistory = statusHistory?.find(
                          (h) => h.status === step,
                        );

                        return (
                          <div
                            key={step}
                            className={`relative flex items-start gap-4 transition-all duration-300 ${
                              isCurrent ? "scale-[1.02]" : ""
                            }`}
                          >
                            {/* Step Circle */}
                            <div
                              className={`absolute left-0 top-1 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shadow-sm ${
                                isCompleted
                                  ? `bg-linear-to-br ${getStatusColor(step)} text-white shadow-md`
                                  : "bg-white border-2 border-slate-200 text-slate-400"
                              }`}
                            >
                              {isCompleted ? (
                                getStatusIcon(step)
                              ) : (
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                              )}
                            </div>

                            {/* Step Content */}
                            <div
                              className={`flex-1 min-w-0 p-3 ml-5 rounded-xl transition-all duration-300 ${
                                isCurrent
                                  ? "bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm"
                                  : isCompleted
                                    ? "bg-slate-50/80"
                                    : "bg-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`font-semibold text-sm ${
                                    isCurrent
                                      ? "text-green-700"
                                      : isCompleted
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {step.charAt(0).toUpperCase() + step.slice(1)}
                                </p>
                                {isCurrent && (
                                  <Badge className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200 animate-pulse">
                                    Current
                                  </Badge>
                                )}
                                {isCompleted && !isCurrent && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </div>

                              {/* Step Description */}
                              <p
                                className={`text-xs mt-0.5 ${isCompleted ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {step === "pending" &&
                                  "Order received & being reviewed"}
                                {step === "processing" &&
                                  "Preparing your order"}
                                {step === "shipped" && "On the way to you"}
                                {step === "delivered" &&
                                  "Successfully delivered"}
                              </p>

                              {/* Timestamp */}
                              {stepHistory && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Clock3 className="h-3 w-3 text-slate-400" />
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    {new Date(
                                      stepHistory.created_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              )}

                              {/* Pending indicator */}
                              {!isCompleted && (
                                <p className="text-[11px] text-slate-400 mt-1.5 italic">
                                  Waiting...
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estimated Delivery Card for Mobile */}
                  {estimatedDelivery &&
                    order.status !== "cancelled" &&
                    order.status !== "delivered" && (
                      <div className="mt-5 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-600 font-medium">
                              Estimated Delivery
                            </p>
                            <p className="text-sm font-bold text-blue-900">
                              {estimatedDelivery.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <Clock3 className="h-5 w-5 text-blue-400 shrink-0" />
                        </div>
                      </div>
                    )}

                  {/* Delivered Success Card for Mobile */}
                  {order.status === "delivered" && (
                    <div className="mt-5 p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <PartyPopper className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-green-800">
                            Order Delivered! 🎉
                          </p>
                          <p className="text-xs text-green-600">
                            Thank you for shopping with us
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {order.status === "cancelled" && (
            <Card className="mb-8 border-red-200 bg-red-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <CardContent className="p-6 flex items-center justify-center gap-3">
                <X className="h-5 w-5 text-red-500" />
                <p className="text-red-600 font-medium">
                  This order has been cancelled
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Order Items */}
            <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="h-1.5 w-full bg-linear-to-r from-green-400 to-emerald-500" />
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  Order Items
                  <Badge variant="secondary" className="ml-auto">
                    {order.order_items.length} item
                    {order.order_items.length > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {order.order_items.map((item: any) => {
                    const savings = calculateSavings(item);
                    const hasDiscount = savings > 0;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={
                                item.products?.image_url || "/placeholder.svg"
                              }
                              alt={item.products?.name || "Product"}
                              className="h-full w-full object-cover"
                            />
                            {/* Savings Badge */}
                            {hasDiscount && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                SAVE
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/products/${item.products?.slug}`}
                                  className="font-medium text-slate-900 hover:text-blue-600 text-sm line-clamp-2"
                                >
                                  {item.products?.name}
                                </Link>

                                {/* Price with Strikethrough */}
                                <div className="flex items-center gap-2 mt-1">
                                  {hasDiscount && (
                                    <span className="text-xs text-slate-400 line-through">
                                      {currencySymbol}
                                      {Number(item.original_price).toFixed(0)}
                                    </span>
                                  )}
                                  <span className="text-sm text-slate-600">
                                    {currencySymbol}
                                    {Number(item.price).toFixed(0)} ×{" "}
                                    {item.quantity}
                                  </span>
                                </div>

                                {/* Stock Status Indicator */}
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-xs text-green-600">
                                    In Stock
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="font-semibold text-slate-900">
                                  {currencySymbol}
                                  {(Number(item.price) * item.quantity).toFixed(
                                    0,
                                  )}
                                </p>
                                {hasDiscount && (
                                  <p className="text-xs text-green-600 font-medium">
                                    You saved {currencySymbol}
                                    {savings.toFixed(0)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Buy Again Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 h-8 text-xs"
                              onClick={() => handleBuyAgain(item)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1.5" />
                              Buy Again
                            </Button>
                          </div>
                        </div>

                        {order.status === "delivered" && item.products && (
                          <OrderItemReview
                            productId={item.products.id}
                            productName={item.products.name}
                            userId={userId}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">
                      {currencySymbol}
                      {Number(
                        order.total + (order.discount_amount || 0),
                      ).toFixed(0)}
                    </span>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5" />
                      Tax (incl.)
                    </span>
                    <span className="text-slate-600">Included</span>
                  </div>

                  {/* Gift Wrap Charge */}
                  {isGift && order.gift_wrap && order.gift_wrap_charge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-pink-500" />
                        Gift Wrap
                      </span>
                      <span className="text-slate-900">
                        {currencySymbol}
                        {Number(order.gift_wrap_charge).toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* Discount with Animation */}
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm bg-green-50 -mx-4 px-4 py-2 rounded-lg animate-pulse">
                      <span className="text-green-700 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Discount{" "}
                        {order.coupon_code && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 text-[10px]"
                          >
                            {order.coupon_code}
                          </Badge>
                        )}
                      </span>
                      <span className="text-green-700 font-medium">
                        -{currencySymbol}
                        {Number(order.discount_amount).toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* Total Item Savings */}
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Product Savings
                      </span>
                      <span>
                        -{currencySymbol}
                        {totalSavings.toFixed(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>

                  {/* Payment Method Badge */}
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      {getPaymentMethodIcon()}
                      Payment Method
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getPaymentMethodLabel()}
                    </Badge>
                  </div>

                  {/* Payment Status / Transaction ID / Paid At — for COD
                      orders these describe the mandatory 20% online advance
                      payment, not the full order, so label them clearly. */}
                  {(() => {
                    const isCodOrder =
                      (order.payment_method || "").toLowerCase() === "cod";
                    const hasAdvance =
                      isCodOrder && Number(order.advance_amount) > 0;

                    return (
                      <>
                        {order.payment_status && (
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>
                              {hasAdvance
                                ? "Advance Payment Status"
                                : "Payment Status"}
                            </span>
                            <span className="font-medium uppercase">
                              {order.payment_status}
                            </span>
                          </div>
                        )}

                        {(order.transaction_id || order.cf_payment_id) && (
                          <div className="flex justify-between text-xs text-slate-500 gap-2">
                            <span className="shrink-0">
                              {hasAdvance
                                ? "Advance Transaction ID"
                                : "Transaction ID"}
                            </span>
                            <span className="font-mono text-slate-700 truncate text-right">
                              {order.transaction_id || order.cf_payment_id}
                            </span>
                          </div>
                        )}

                        {order.paid_at && (
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>
                              {hasAdvance ? "Advance Paid On" : "Paid On"}
                            </span>
                            <span className="text-slate-700">
                              {new Date(order.paid_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="flex justify-between font-bold text-lg pt-3 border-t-2">
                    <span className="text-slate-900">Total</span>
                    <span className="text-slate-900">
                      {currencySymbol}
                      {Number(order.total).toFixed(0)}
                    </span>
                  </div>

                  {/* COD advance / due breakdown */}
                  {(order.payment_method || "").toLowerCase() === "cod" &&
                    Number(order.advance_amount) > 0 && (
                      <div className="mt-1 p-2.5 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                        <p className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Online payment was required to confirm this COD order
                        </p>
                        <div className="flex justify-between text-sm text-blue-700 font-medium">
                          <span>Paid Online (Advance)</span>
                          <span>
                            {currencySymbol}
                            {Number(order.advance_amount).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Due on Delivery (Cash)</span>
                          <span>
                            {currencySymbol}
                            {Number(order.cod_amount).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="h-1.5 w-full bg-linear-to-r from-blue-400 to-indigo-500" />
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    Shipping Address
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8"
                          onClick={() => {
                            const address = [
                              order.customer_name,
                              order.shipping_address,
                              order.shipping_city,
                              order.shipping_postal_code,
                              order.shipping_country,
                            ]
                              .filter(Boolean)
                              .join(", ");
                            copyToClipboard(address, "address");
                          }}
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="ml-1.5 text-xs">Copy</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Address</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm space-y-1">
                    {order.customer_name && (
                      <p className="font-semibold text-slate-900">
                        {order.customer_name}
                      </p>
                    )}
                    {order.shipping_address && (
                      <p className="text-slate-600">{order.shipping_address}</p>
                    )}
                    <p className="text-slate-600">
                      {[order.shipping_city, order.shipping_postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {order.shipping_country && (
                      <p className="text-slate-600">{order.shipping_country}</p>
                    )}
                  </div>

                  {/* Delivery Notes */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <StickyNote className="h-3.5 w-3.5" />
                        Delivery Notes
                      </p>
                      {canEditNotes && !isEditingNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            setNotesDraft(deliveryNotes);
                            setIsEditingNotes(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {deliveryNotes ? "Edit" : "Add"}
                        </Button>
                      )}
                    </div>

                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesDraft}
                          onChange={(e) =>
                            setNotesDraft(e.target.value.slice(0, 300))
                          }
                          maxLength={300}
                          placeholder="e.g. Leave at the doorstep, call before delivery, nearby landmark..."
                          className="min-h-20 text-sm"
                          disabled={isSavingNotes}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {notesDraft.length}/300
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isSavingNotes}
                              onClick={() => {
                                setIsEditingNotes(false);
                                setNotesDraft(deliveryNotes);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isSavingNotes}
                              onClick={handleSaveDeliveryNotes}
                            >
                              {isSavingNotes ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : deliveryNotes ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {deliveryNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No delivery notes added
                        {canEditNotes ? "" : " for this order"}.
                      </p>
                    )}

                    {!canEditNotes && (
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Delivery notes can no longer be updated — this order has
                        already been dispatched.
                      </p>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {order.customer_email && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {order.customer_email}
                      </p>
                    )}
                    {order.customer_phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Activity - Collapsible */}
            {statusHistory && statusHistory.length > 0 && (
              <Card
                className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400"
                ref={timelineRef}
              >
                <div className="h-1.5 w-full bg-linear-to-r from-purple-400 to-fuchsia-500" />
                <Collapsible
                  open={isHistoryOpen}
                  onOpenChange={setIsHistoryOpen}
                >
                  <CardHeader className="border-b bg-slate-50/50">
                    <CollapsibleTrigger className="w-full">
                      <CardTitle className="text-base flex items-center gap-2 cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-purple-600" />
                        </div>
                        Order Activity
                        <Badge variant="secondary" className="ml-2">
                          {statusHistory.length} update
                          {statusHistory.length > 1 ? "s" : ""}
                        </Badge>
                        <div className="ml-auto flex items-center gap-2">
                          {/* Notify Toggle */}
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-slate-500">
                              Notify
                            </span>
                            <Switch
                              checked={notifyEnabled}
                              onCheckedChange={setNotifyEnabled}
                              className="scale-75"
                            />
                          </div>
                          {isHistoryOpen ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </CardTitle>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-4">
                      <div className="space-y-0">
                        {statusHistory.map((history: any, index: number) => (
                          <div
                            key={history.id}
                            className={`flex gap-3 transition-all duration-500 ${
                              timelineVisible
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-4"
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                                  index === 0
                                    ? `bg-linear-to-r ${getStatusColor(history.status)} text-white shadow-lg`
                                    : "bg-white border-2 border-slate-200 text-slate-400"
                                }`}
                              >
                                {index === 0 ? (
                                  getStatusIcon(history.status)
                                ) : (
                                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                                )}
                              </div>
                              {index < statusHistory.length - 1 && (
                                <div className="w-0.5 flex-1 bg-slate-200 min-h-8" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`font-medium text-sm capitalize ${
                                    index === 0
                                      ? "text-green-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {history.status}
                                </p>
                                {index === 0 && (
                                  <Badge className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200">
                                    Latest
                                  </Badge>
                                )}
                              </div>
                              {history.note && (
                                <p className="text-sm text-slate-500 mt-1">
                                  {history.note}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-1.5">
                                {new Date(
                                  history.created_at,
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Tracking Info */}
            {order.tracking_number && (
              <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <div className="h-1.5 w-full bg-linear-to-r from-orange-400 to-amber-500" />
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-orange-600" />
                    </div>
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* QR Code Placeholder */}
                    <div className="shrink-0 flex items-center justify-center w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-200">
                      <QrCode className="h-12 w-12 text-slate-400" />
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Carrier Info */}
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Carrier</p>
                          <p className="font-medium text-sm">
                            {order.carrier_name || "Standard Shipping"}
                          </p>
                        </div>
                      </div>

                      {/* Tracking Number */}
                      <div className="bg-slate-50 rounded-lg p-3 border flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">
                            Tracking Number
                          </p>
                          <p className="font-mono text-sm font-semibold text-slate-900 select-all">
                            {order.tracking_number}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  order.tracking_number,
                                  "tracking",
                                )
                              }
                            >
                              {copiedTracking ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Tracking Number</TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Track on Carrier Website */}
                      <Button variant="outline" className="w-full" asChild>
                        <a
                          href={`https://track.aftership.com/${order.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Track on Carrier Website
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
              <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-3 text-center shadow-sm">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                  Secure Payment
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-3 text-center shadow-sm">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                  Easy Returns
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-3 text-center shadow-sm">
                <Headphones className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                  24/7 Support
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 justify-center flex-wrap pt-2 pb-4 animate-in fade-in duration-700 delay-700">
              <Button
                asChild
                size="lg"
                className={`gap-1.5 bg-linear-to-r ${
                  isGift
                    ? "from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    : "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                }`}
              >
                <Link href="/products">Continue Shopping</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/orders">Back to Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </TooltipProvider>
  );
}

// Skeleton Loading State
function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container max-w-4xl mx-auto py-8 px-4 md:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Hero Banner Skeleton */}
        <Skeleton className="h-48 rounded-2xl mb-8" />

        {/* Progress Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Items Skeleton */}
        <Card className="mb-6">
          <CardHeader className="border-b">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* More Skeletons */}
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
