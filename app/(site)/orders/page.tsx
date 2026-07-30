import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrdersClient } from "@/components/orders-client";

const ORDERS_PER_PAGE = 10;

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
        product_id,
        products (
          id,
          name,
          price,
          image_url,
          stock
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

  // Count delivered this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: deliveredThisMonth } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "delivered")
    .gte("created_at", startOfMonth.toISOString());

  // Count pending reviews (delivered orders without reviews)
  const { data: deliveredOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "delivered");

  const deliveredOrderIds = deliveredOrders?.map((o) => o.id) || [];

  let pendingReviewCount = 0;
  if (deliveredOrderIds.length > 0) {
    const { data: reviewedOrders } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id);

    // Simple estimate: assume each delivered order needs 1 review
    pendingReviewCount = Math.max(
      0,
      deliveredOrderIds.length - (reviewedOrders?.length || 0),
    );
  }

  // Mark orders with pending reviews
  const ordersWithReviewStatus = (orders || []).map((order) => ({
    ...order,
    has_pending_review:
      order.status === "delivered" &&
      deliveredOrderIds.includes(order.id) &&
      pendingReviewCount > 0,
  }));

  return (
    <OrdersClient
      orders={ordersWithReviewStatus as any}
      deliveredThisMonth={deliveredThisMonth || 0}
      pendingReviewCount={pendingReviewCount}
      currencySymbol={currencySymbol}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
