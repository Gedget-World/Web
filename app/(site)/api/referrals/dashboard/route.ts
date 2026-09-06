import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — aggregated stats + history for the logged-in affiliate's dashboard.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!affiliate) {
      return NextResponse.json({ affiliate: null });
    }

    const [{ data: links }, { data: commissions }, { data: payouts }] =
      await Promise.all([
        supabase
          .from("referral_links")
          .select("clicks_count")
          .eq("affiliate_id", affiliate.id),
        supabase
          .from("referral_commissions")
          .select(
            "id, order_id, product_id, commission_amount, status, created_at, confirmed_at, products(name, slug, image_url)",
          )
          .eq("affiliate_id", affiliate.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("commission_payouts")
          .select("*")
          .eq("affiliate_id", affiliate.id)
          .order("created_at", { ascending: false }),
      ]);

    const totalClicks = (links || []).reduce(
      (sum, l) => sum + (l.clicks_count || 0),
      0,
    );
    const uniqueOrders = new Set((commissions || []).map((c) => c.order_id));

    const sumByStatus = (status: string) =>
      (commissions || [])
        .filter((c) => c.status === status)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const stats = {
      totalClicks,
      totalOrders: uniqueOrders.size,
      pendingAmount: sumByStatus("pending"),
      confirmedAmount: sumByStatus("confirmed"),
      paidAmount: sumByStatus("paid"),
      lifetimeEarnings: sumByStatus("confirmed") + sumByStatus("paid"),
    };

    return NextResponse.json({
      affiliate,
      stats,
      commissions: commissions || [],
      payouts: payouts || [],
    });
  } catch (error) {
    console.error("[referrals/dashboard] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
