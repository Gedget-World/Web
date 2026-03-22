import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, MapPin, Truck, CheckCircle2, Clock } from "lucide-react";
import { InvoiceDownloadButton } from "@/components/invoice-download-button";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { OrderItemReview } from "@/components/order-item-review";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/orders");
  }

  // Fetch order details
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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!order) {
    notFound();
  }

  // Fetch order status history
  const { data: statusHistory } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 md:px-8">
      <div className="mb-8">
        <Link
          href="/orders"
          className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-flex items-center gap-1"
        >
          ← Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <InvoiceDownloadButton order={order} />
            {order.status === "pending" && (
              <CancelOrderButton orderId={order.id} />
            )}
          </div>
        </div>

        {/* Order Progress Timeline */}
        {order.status !== "cancelled" && (
          <div className="mt-6">
            <div className="relative">
              {/* Background line */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200" />
              {/* Progress line */}
              <div
                className="absolute top-4 left-0 h-1 bg-green-500 transition-all"
                style={{
                  width: `${(["pending", "processing", "shipped", "delivered"].indexOf(order.status) / 3) * 100}%`,
                }}
              />
              {/* Steps */}
              <div className="relative flex justify-between">
                {["pending", "processing", "shipped", "delivered"].map(
                  (step, index) => {
                    const statusOrder = [
                      "pending",
                      "processing",
                      "shipped",
                      "delivered",
                    ];
                    const currentIndex = statusOrder.indexOf(order.status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-slate-200 text-slate-400"
                          } ${isCurrent ? "ring-2 ring-green-200" : ""}`}
                        >
                          {getStatusIcon(step)}
                        </div>
                        <span
                          className={`text-xs mt-2 whitespace-nowrap ${
                            isCompleted
                              ? "text-green-600 font-medium"
                              : "text-slate-400"
                          }`}
                        >
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="mt-6 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-red-600 text-sm font-medium text-center">
              Order Cancelled
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Order Items */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {order.order_items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={item.products?.image_url || "/placeholder.svg"}
                        alt={item.products?.name || "Product"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.products?.slug}`}
                        className="font-medium text-slate-900 hover:text-blue-600 text-sm truncate block max-w-[50%]"
                      >
                        {item.products?.name}
                      </Link>
                      <p className="text-sm text-slate-500 mt-1">
                        Qty: {item.quantity} × &#8377;
                        {Number(item.price).toFixed(0)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-900">
                        &#8377;{(Number(item.price) * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  </div>
                  {order.status === "delivered" && item.products && (
                    <OrderItemReview
                      productId={item.products.id}
                      productName={item.products.name}
                      userId={user.id}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900">
                  &#8377;
                  {Number(order.total - (order.discount_amount || 0)).toFixed(
                    0,
                  )}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount {order.coupon_code && `(${order.coupon_code})`}
                  </span>
                  <span>
                    -&#8377;{Number(order.discount_amount).toFixed(0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-900">&#8377;10</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">
                  &#8377;{Number(order.total).toFixed(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {order.shipping_address && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm space-y-0.5">
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
              {order.customer_email && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-slate-400 rounded-full"></span>
                    {order.customer_email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Activity */}
        {statusHistory && statusHistory.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                Order Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-0">
                {statusHistory.map((history: any, index: number) => (
                  <div key={history.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          index === 0
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {index === 0 ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      {index < statusHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 min-h-6" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium text-sm ${index === 0 ? "text-green-600" : "text-slate-700"}`}
                        >
                          {history.status.charAt(0).toUpperCase() +
                            history.status.slice(1)}
                        </p>
                        {index === 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                            Latest
                          </span>
                        )}
                      </div>
                      {history.note && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          {history.note}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(history.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Info */}
        {order.tracking_number && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-orange-600" />
                </div>
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                <p className="font-mono text-sm font-semibold text-slate-900 select-all">
                  {order.tracking_number}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
