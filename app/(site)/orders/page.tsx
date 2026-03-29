import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";

const ORDERS_PER_PAGE = 5;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/orders");
  }

  // Get total count for pagination
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch currency symbol from settings
  const { data: currencySetting } = await supabase
    .from("store_settings")
    .select("setting_value")
    .eq("setting_key", "currency_symbol")
    .single();

  const currencySymbol = currencySetting?.setting_value || "₹";

  const totalPages = Math.ceil((totalOrders || 0) / ORDERS_PER_PAGE);

  // Fetch user's orders with order items (paginated)
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      total,
      status,
      created_at,
      order_items (
        id,
        quantity,
        products (
          name,
          image_url
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(
      (currentPage - 1) * ORDERS_PER_PAGE,
      currentPage * ORDERS_PER_PAGE - 1,
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Orders</h1>
        <p className="text-slate-500 text-sm">
          {totalOrders || 0} order{totalOrders !== 1 ? "s" : ""} placed
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No orders yet
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Start shopping to see your orders here
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum: number, item: any) => sum + item.quantity,
                0,
              );

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block"
                >
                  <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <CardContent className="px-4">
                      <div className="flex flex-col gap-3">
                        {/* Order Info Row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(order.status)}`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              {formatDate(order.created_at)} · {itemCount} item
                              {itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>

                          {/* Price & Arrow */}
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900">
                              {currencySymbol}
                              {Number(order.total).toFixed(0)}
                            </span>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>

                        {/* Product Images Row */}
                        <div className="flex -space-x-2">
                          {order.order_items.slice(0, 4).map((item: any) => (
                            <div
                              key={item.id}
                              className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 border-2 border-white"
                            >
                              <img
                                src={
                                  item.products?.image_url || "/placeholder.svg"
                                }
                                alt={item.products?.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {order.order_items.length > 4 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 border-2 border-white text-xs font-medium text-slate-600">
                              +{order.order_items.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
              >
                {currentPage > 1 ? (
                  <Link href={`/orders?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </>
                )}
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      asChild={pageNum !== currentPage}
                    >
                      {pageNum !== currentPage ? (
                        <Link href={`/orders?page=${pageNum}`}>{pageNum}</Link>
                      ) : (
                        <span>{pageNum}</span>
                      )}
                    </Button>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
              >
                {currentPage < totalPages ? (
                  <Link href={`/orders?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
