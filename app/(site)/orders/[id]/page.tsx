import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetailClient } from "@/components/order-detail-client";

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

  // Fetch currency symbol from settings
  const { data: currencySetting } = await supabase
    .from("store_settings")
    .select("setting_value")
    .eq("setting_key", "currency_symbol")
    .single();

  const currencySymbol = currencySetting?.setting_value || "₹";

  return (
    <OrderDetailClient
      order={order}
      statusHistory={statusHistory || []}
      currencySymbol={currencySymbol}
      userId={user.id}
    />
  );
}
