import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Gift,
  Truck,
  MapPin,
  Bell,
  BellOff,
  EyeOff,
  Sparkles,
  Package,
  PartyPopper,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Home,
  ArrowRight,
  ClipboardCheck,
  StickyNote,
} from "lucide-react";

const CONFETTI_COLORS = [
  "bg-pink-500",
  "bg-purple-500",
  "bg-amber-400",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
];

function Confetti({ count = 40 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 3 + Math.random() * 2.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.5 ? "rounded-full" : "rotate-45",
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-success-confetti"
          style={{
            left: `${p.left}%`,
            top: "-10%",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div className={`h-2.5 w-2.5 ${p.color} ${p.shape}`} />
        </div>
      ))}
    </div>
  );
}

function GenericSuccess() {
  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-white py-12 px-4 md:px-8 max-w-2xl mx-auto">
      <Card className="text-center overflow-hidden border-emerald-200 shadow-lg animate-in fade-in zoom-in-95 duration-500">
        <div className="h-1.5 w-full bg-linear-to-r from-emerald-400 via-teal-400 to-green-500" />
        <CardHeader>
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-75" />
            <div className="relative h-16 w-16 rounded-full bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md">
              <CheckCircle className="h-9 w-9 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Order Placed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-600">
            Thank you for your purchase. We&apos;ve received your order and will
            send you a confirmation email shortly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              asChild
              size="lg"
              className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Link href="/orders">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/checkout/success");
  }

  if (!orderId) {
    return <GenericSuccess />;
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          id,
          name,
          image_url,
          slug
        )
      )
    `,
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  // If the order isn't found (or doesn't belong to this user), fall back to
  // the generic success message instead of erroring out.
  if (!order) {
    return <GenericSuccess />;
  }

  const { data: currencySetting } = await supabase
    .from("store_settings")
    .select("setting_value")
    .eq("setting_key", "currency_symbol")
    .single();

  const currencySymbol = currencySetting?.setting_value || "₹";

  const isGift = Boolean(order.is_gift);
  const items: any[] = order.order_items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const discount = Number(order.discount_amount) || 0;
  const giftWrapCharge = Number(order.gift_wrap_charge) || 0;
  const total = Number(order.total) || 0;
  const isCodOrder = order.payment_method === "cod";
  const advanceAmount = Number(order.advance_amount) || 0;
  const codDueAmount = Number(order.cod_amount) || 0;

  return (
    <main
      className={`min-h-screen py-10 px-4 md:px-8 max-w-3xl mx-auto space-y-6 ${
        isGift
          ? "bg-linear-to-b from-pink-50 via-purple-50/40 to-white"
          : "bg-linear-to-b from-emerald-50 via-teal-50/40 to-white"
      }`}
    >
      <Confetti />

      {/* Hero */}
      <Card
        className={`text-center overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-500 ${
          isGift ? "border-pink-200" : "border-emerald-200"
        }`}
      >
        <div
          className={`h-2 w-full bg-linear-to-r ${
            isGift
              ? "from-pink-400 via-fuchsia-400 to-purple-500"
              : "from-emerald-400 via-teal-400 to-green-500"
          }`}
        />
        <CardHeader className="pb-2">
          <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                isGift ? "bg-pink-300" : "bg-emerald-300"
              }`}
            />
            <div
              className={`relative h-20 w-20 rounded-full flex items-center justify-center shadow-lg bg-linear-to-br ${
                isGift
                  ? "from-pink-400 to-fuchsia-600"
                  : "from-emerald-400 to-green-600"
              }`}
            >
              {isGift ? (
                <Gift className="h-10 w-10 text-white" />
              ) : (
                <CheckCircle className="h-10 w-10 text-white" />
              )}
            </div>
            <PartyPopper
              className={`absolute -right-1 -top-1 h-7 w-7 rotate-12 ${
                isGift ? "text-fuchsia-500" : "text-amber-500"
              }`}
            />
          </div>
          <CardTitle
            className={`text-2xl sm:text-3xl bg-clip-text text-transparent bg-linear-to-r ${
              isGift
                ? "from-pink-600 to-purple-600"
                : "from-emerald-600 to-teal-600"
            }`}
          >
            {isGift
              ? "Your Gift Order is Confirmed! 🎁"
              : "Order Placed Successfully! 🎉"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            {isGift
              ? "Great choice! We're preparing your gift with care. A confirmation email is on its way."
              : "Thank you for shopping with us — you made a great choice! We've received your order and will send a confirmation email shortly."}
          </p>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${
              isGift
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Order ID:{" "}
            <span className="font-mono font-semibold">{order.id}</span>
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <CardContent className="py-5">
          <div className="flex items-center justify-between gap-2">
            {[
              { icon: ClipboardCheck, label: "Order Confirmed", active: true },
              { icon: Package, label: "Packed", active: false },
              { icon: Truck, label: "Shipped", active: false },
              { icon: Home, label: "Delivered", active: false },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      step.active
                        ? `bg-linear-to-br ${
                            isGift
                              ? "from-pink-400 to-fuchsia-600"
                              : "from-emerald-400 to-green-600"
                          } text-white shadow-md`
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-medium ${
                      step.active ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-0.5 flex-1 -mx-1 mb-5 bg-slate-100" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isGift && (
        <Card className="border-pink-200 bg-linear-to-br from-pink-50 to-purple-50/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="h-1.5 w-full bg-linear-to-r from-pink-400 to-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
              <Sparkles className="h-5 w-5" />
              Gift Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2 rounded-lg bg-white/70 border border-pink-100 p-3">
              <MapPin className="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">
                  Shipping to {order.recipient_name}
                </p>
                <p className="text-slate-600">
                  {order.recipient_phone && `${order.recipient_phone} · `}
                  {order.shipping_address}, {order.shipping_city} -{" "}
                  {order.shipping_postal_code}, {order.shipping_country}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {order.notify_recipient ? (
                <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Bell className="h-3 w-3" /> Recipient will be notified
                </Badge>
              ) : (
                <Badge className="gap-1 bg-slate-100 text-slate-600 hover:bg-slate-100 border border-slate-200">
                  <BellOff className="h-3 w-3" /> Recipient not notified
                </Badge>
              )}
              {order.hide_prices && (
                <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
                  <EyeOff className="h-3 w-3" /> Prices hidden on slip
                </Badge>
              )}
              {order.gift_wrap && (
                <Badge className="gap-1 bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200">
                  <Gift className="h-3 w-3" /> Gift wrapped
                </Badge>
              )}
            </div>

            {order.gift_message && (
              <div className="rounded-md border border-pink-200 bg-white p-3 mt-2 relative">
                <Sparkles className="absolute -top-2 -left-2 h-4 w-4 text-pink-400" />
                <p className="text-xs font-medium text-pink-500 mb-1">
                  Gift Message
                </p>
                <p className="text-slate-700 whitespace-pre-wrap italic">
                  "{order.gift_message}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isGift && (
        <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="h-1.5 w-full bg-linear-to-r from-emerald-400 to-teal-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
              <Truck className="h-5 w-5" />
              Shipping To
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <div className="flex items-start gap-2 rounded-lg bg-white/70 border border-emerald-100 p-3">
              <MapPin className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">
                  {order.customer_name}
                </p>
                <p>
                  {order.shipping_address}, {order.shipping_city} -{" "}
                  {order.shipping_postal_code}, {order.shipping_country}
                </p>
              </div>
            </div>
            {order.delivery_notes && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 border border-emerald-100 p-3">
                <StickyNote className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-0.5">
                    Delivery Notes
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {order.delivery_notes}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isGift && order.delivery_notes && (
        <Card className="border-pink-200 bg-linear-to-br from-pink-50 to-purple-50/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="h-1.5 w-full bg-linear-to-r from-pink-400 to-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
              <StickyNote className="h-5 w-5" />
              Delivery Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-slate-700 whitespace-pre-wrap rounded-lg bg-white/70 border border-pink-100 p-3">
              {order.delivery_notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package
              className={`h-5 w-5 ${isGift ? "text-pink-600" : "text-emerald-600"}`}
            />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-slate-50"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-slate-50">
                  {item.products?.image_url && (
                    <Image
                      src={item.products.image_url}
                      alt={item.products?.name || "Product"}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.products?.name || "Product"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Qty {item.quantity} × {currencySymbol}
                    {Number(item.price).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {currencySymbol}
                  {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>
                {currencySymbol}
                {subtotal.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount{order.coupon_code && ` (${order.coupon_code})`}
                </span>
                <span>
                  -{currencySymbol}
                  {discount.toFixed(2)}
                </span>
              </div>
            )}
            {giftWrapCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Gift wrap</span>
                <span>
                  {currencySymbol}
                  {giftWrapCharge.toFixed(2)}
                </span>
              </div>
            )}
            <div
              className={`flex justify-between font-bold text-base pt-2 mt-1 border-t ${
                isGift ? "text-pink-700" : "text-emerald-700"
              }`}
            >
              <span>Total</span>
              <span>
                {currencySymbol}
                {total.toFixed(2)}
              </span>
            </div>
            {isCodOrder && advanceAmount > 0 && (
              <>
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>Paid Online (Advance)</span>
                  <span>
                    {currencySymbol}
                    {advanceAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due on Delivery</span>
                  <span>
                    {currencySymbol}
                    {codDueAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className="border-slate-300 bg-slate-50 text-slate-700"
            >
              {order.payment_method === "cod"
                ? "Cash on Delivery"
                : "Paid Online"}
            </Badge>
            <Badge
              className={`capitalize ${
                isGift
                  ? "bg-pink-100 text-pink-700 hover:bg-pink-100 border border-pink-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              {order.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
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

      <div className="flex gap-3 justify-center flex-wrap pt-2 animate-in fade-in duration-700 delay-700">
        <Button
          asChild
          size="lg"
          className={`gap-1.5 bg-linear-to-r ${
            isGift
              ? "from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              : "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          }`}
        >
          <Link href={`/orders/${order.id}`}>
            View Order Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
