"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  ChevronRight,
  X,
  Check,
  Copy,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { image_url: string }[];
  } | null;
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  payment_method: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  is_returnable: boolean | null;
  return_window: number;
  return_requested: boolean | null;
  return_reason: string | null;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusFlow = ["pending", "processing", "shipped", "delivered"];

const getNextStatus = (currentStatus: string): string | null => {
  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1)
    return null;
  return statusFlow[currentIndex + 1];
};

const canCancel = (currentStatus: string): boolean => {
  return currentStatus === "pending";
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const supabase = createClient();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              name,
              slug,
              images:product_images (image_url)
            )
          )
        `,
        )
        .eq("id", orderId)
        .single();

      console.log("Order fetch result:", { data, error });
      if (!error && data) {
        setOrder(data as Order);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [supabase, orderId]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (!error && order) {
      setOrder({ ...order, status: newStatus });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found.</p>
        </div>
      </div>
    );
  }

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-sm text-muted-foreground">
              Order ID: {order.id}
            </p>
          </div>
        </div>
        <Badge className={statusColors[order.status] || "bg-gray-100"}>
          {order.status}
        </Badge>
      </div>

      {/* Row 1: Shipping Address, Customer, Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {order.shipping_address ? (
              <>
                <p className="flex items-center justify-between">
                  <span>
                    <strong>Address:</strong> {order.shipping_address}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(order.shipping_address!, "address")
                    }
                    className="p-1 hover:bg-gray-100 rounded transition-all"
                    title="Copy address"
                  >
                    {copied === "address" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                </p>
                {order.shipping_city && (
                  <p className="flex items-center justify-between">
                    <span>
                      <strong>City:</strong> {order.shipping_city}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.shipping_city!, "city")
                      }
                      className="p-1 hover:bg-gray-100 rounded transition-all"
                      title="Copy city"
                    >
                      {copied === "city" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </p>
                )}
                {order.shipping_postal_code && (
                  <p className="flex items-center justify-between">
                    <span>
                      <strong>Postal Code:</strong> {order.shipping_postal_code}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.shipping_postal_code!, "postal")
                      }
                      className="p-1 hover:bg-gray-100 rounded transition-all"
                      title="Copy postal code"
                    >
                      {copied === "postal" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </p>
                )}
                {order.shipping_country && (
                  <p className="flex items-center justify-between">
                    <span>
                      <strong>Country:</strong> {order.shipping_country}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.shipping_country!, "country")
                      }
                      className="p-1 hover:bg-gray-100 rounded transition-all"
                      title="Copy country"
                    >
                      {copied === "country" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </p>
                )}
                {/* Copy Full Address Button */}
                <div className="pt-2 mt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const fullAddress = [
                        order.shipping_address,
                        order.shipping_city,
                        order.shipping_postal_code,
                        order.shipping_country,
                      ]
                        .filter(Boolean)
                        .join(", ");
                      copyToClipboard(fullAddress, "fullAddress");
                    }}
                  >
                    {copied === "fullAddress" ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy Full Address
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No address provided</p>
            )}
            {order.tracking_number && (
              <p className="flex items-center justify-between mt-2 pt-2 border-t">
                <span>
                  <strong>Tracking:</strong> {order.tracking_number}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(order.tracking_number!, "tracking")
                  }
                  className="p-1 hover:bg-gray-100 rounded transition-all"
                  title="Copy tracking number"
                >
                  {copied === "tracking" ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span>
                <strong>Name:</strong> {order.customer_name || "N/A"}
              </span>
              {order.customer_name && (
                <button
                  onClick={() => copyToClipboard(order.customer_name!, "name")}
                  className="p-1 hover:bg-gray-100 rounded transition-all"
                  title="Copy name"
                >
                  {copied === "name" ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              )}
            </p>
            <p className="flex items-center justify-between">
              <span>
                <strong>Email:</strong> {order.customer_email || "N/A"}
              </span>
              {order.customer_email && (
                <button
                  onClick={() =>
                    copyToClipboard(order.customer_email!, "email")
                  }
                  className="p-1 hover:bg-gray-100 rounded transition-all"
                  title="Copy email"
                >
                  {copied === "email" ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Progress */}
            <div className="flex items-center justify-between mb-4">
              {statusFlow.map((status, index) => {
                const currentIndex = statusFlow.indexOf(order.status);
                const isCompleted =
                  order.status !== "cancelled" && index < currentIndex;
                const isCurrent = order.status === status;
                const isCancelled = order.status === "cancelled";

                return (
                  <div key={status} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCancelled
                            ? "bg-gray-200 text-gray-400"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                                ? statusColors[status]
                                : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1 capitalize ${isCurrent ? "font-semibold" : ""}`}
                      >
                        {status}
                      </span>
                    </div>
                    {index < statusFlow.length - 1 && (
                      <ChevronRight
                        className={`h-4 w-4 mx-1 ${
                          isCompleted ? "text-green-500" : "text-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Current:</span>
              <Badge className={statusColors[order.status] || "bg-gray-100"}>
                {order.status}
              </Badge>
            </div>

            {/* Action Buttons */}
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <div className="space-y-2">
                {getNextStatus(order.status) && (
                  <Button
                    className="w-full"
                    onClick={() => updateStatus(getNextStatus(order.status)!)}
                    disabled={updating}
                  >
                    {updating ? (
                      "Updating..."
                    ) : (
                      <>
                        Move to{" "}
                        <span className="capitalize ml-1">
                          {getNextStatus(order.status)}
                        </span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}

                {canCancel(order.status) && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => updateStatus("cancelled")}
                    disabled={updating}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Order
                  </Button>
                )}
              </div>
            )}

            {order.status === "delivered" && (
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <Check className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-green-700 font-medium">
                  Order Completed
                </p>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <X className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-sm text-red-700 font-medium">
                  Order Cancelled
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Order Items (full width) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.product?.images?.[0]?.image_url && (
                        <img
                          src={item.product.images[0].image_url}
                          alt={item.product?.name || "Product"}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <span
                        className="cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() =>
                          item.product?.slug &&
                          window.open(
                            `/products/${item.product.slug}`,
                            "_blank",
                          )
                        }
                      >
                        {(item.product?.name || "Unknown Product").slice(0, 20)}
                        {(item.product?.name?.length || 0) > 10 ? "..." : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">₹{item.price}</TableCell>
                  <TableCell className="text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount && order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Discount {order.coupon_code && `(${order.coupon_code})`}
                </span>
                <span>-₹{order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Payment, Timeline, Return Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Method:</strong>{" "}
              {order.payment_method?.toUpperCase() || "N/A"}
            </p>
            {order.invoice_number && (
              <p>
                <strong>Invoice:</strong> {order.invoice_number}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Created:</strong>{" "}
              {new Date(order.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Last Updated:</strong>{" "}
              {new Date(order.updated_at).toLocaleString()}
            </p>
            {order.is_returnable && (
              <p className="text-green-600">
                ✓ Returnable within {order.return_window} days
              </p>
            )}
          </CardContent>
        </Card>

        {/* Return Information */}
        {order.return_requested && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">
                Return Requested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">
                <strong>Reason:</strong>{" "}
                {order.return_reason || "No reason provided"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
