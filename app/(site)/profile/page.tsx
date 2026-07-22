import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/profile");
  }

  // Get customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user's orders with items
  const { data: orders, count: orderCount } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      total,
      status,
      order_items (
        quantity,
        price,
        product:products (
          name,
          image_url
        )
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get user's default address (only storing single address)
  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get wishlist items (if table exists)
  let wishlistItems: any[] = [];
  try {
    const { data } = await supabase
      .from("wishlist")
      .select(
        `
        id,
        product:products (
          id,
          name,
          price,
          image_url,
          slug
        )
      `,
      )
      .eq("user_id", user.id)
      .limit(4);
    wishlistItems = data || [];
  } catch {
    // Wishlist table may not exist
  }

  // Get review count
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Get pending review count (delivered orders without reviews)
  let pendingReviewCount = 0;
  try {
    const { data: deliveredOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "delivered");

    if (deliveredOrders) {
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      pendingReviewCount = Math.max(0, deliveredOrders.length - (count || 0));
    }
  } catch {
    // Reviews table may not exist
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        phone: user.phone || null,
        created_at: user.created_at,
        phone_confirmed_at: user.phone_confirmed_at,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined),
      }}
      customer={customer}
      orders={orders || []}
      orderCount={orderCount || 0}
      address={address || null}
      wishlistItems={wishlistItems}
      reviewCount={reviewCount || 0}
      pendingReviewCount={pendingReviewCount}
    />
  );
}
