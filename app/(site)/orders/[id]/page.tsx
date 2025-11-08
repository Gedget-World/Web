import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, MapPin, Truck, CheckCircle2, Clock } from "lucide-react";

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
          name,
          image_url,
          slug
        )
      )
    `
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "processing":
        return <Package className="h-5 w-5" />;
      case "shipped":
        return <Truck className="h-5 w-5" />;
      case "delivered":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-8">
      <div className="mb-8">
        <Link
          href="/orders"
          className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
        >
          ← Back to Orders
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-slate-600">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${getStatusColor(order.status)} text-base px-4 py-2`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Items in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-slate-100">
                      {item.products?.image_url && (
                        <img
                          src={item.products.image_url || "/placeholder.svg"}
                          alt={item.products.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.products?.slug}`}
                        className="font-medium text-slate-900 hover:text-slate-700"
                      >
                        {item.products?.name}
                      </Link>
                      <p className="text-sm text-slate-600 mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ${Number(item.price).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-900">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.shipping_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {order.customer_name && (
                    <p className="font-medium text-slate-900">
                      {order.customer_name}
                    </p>
                  )}
                  {order.customer_email && (
                    <p className="text-slate-600">{order.customer_email}</p>
                  )}
                  {order.shipping_address && (
                    <p className="text-slate-600">{order.shipping_address}</p>
                  )}
                  {(order.shipping_city || order.shipping_postal_code) && (
                    <p className="text-slate-600">
                      {order.shipping_city}
                      {order.shipping_postal_code &&
                        `, ${order.shipping_postal_code}`}
                    </p>
                  )}
                  {order.shipping_country && (
                    <p className="text-slate-600">{order.shipping_country}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Track your order progress</CardDescription>
            </CardHeader>
            <CardContent>
              {statusHistory && statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((history: any, index: number) => (
                    <div key={history.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            index === 0
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getStatusIcon(history.status)}
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-slate-900">
                          {history.status.charAt(0).toUpperCase() +
                            history.status.slice(1)}
                        </p>
                        {history.note && (
                          <p className="text-sm text-slate-600 mt-1">
                            {history.note}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(history.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No status updates available
                </p>
              )}
            </CardContent>
          </Card>

          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-2">Tracking Number</p>
                <p className="font-mono text-sm font-medium text-slate-900">
                  {order.tracking_number}
                </p>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
