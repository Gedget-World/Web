import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;
  if (!sessionToken) return false;

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) return false;
  if (new Date(session.expires_at) < new Date()) return false;
  return true;
}

// GET — full detail view for one affiliate: profile, links, commissions, payouts.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> },
) {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { affiliateId } = await params;
    const supabase = createServiceClient();

    const { data: affiliate, error } = await supabase
      .from("affiliates")
      .select("*, customers(first_name, last_name, phone)")
      .eq("id", affiliateId)
      .single();

    if (error || !affiliate) {
      return NextResponse.json(
        { error: "Affiliate not found" },
        { status: 404 },
      );
    }

    const [
      { data: authUser },
      { data: links },
      { data: commissions },
      { data: payouts },
    ] = await Promise.all([
      supabase.auth.admin.getUserById(affiliate.user_id),
      supabase
        .from("referral_links")
        .select(
          "id, product_id, link_code, clicks_count, created_at, products(name, slug)",
        )
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false }),
      supabase
        .from("referral_commissions")
        .select(
          "id, order_id, product_id, commission_amount, status, needs_clawback, created_at, confirmed_at, products(name)",
        )
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false }),
      supabase
        .from("commission_payouts")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      affiliate: { ...affiliate, email: authUser?.user?.email || null },
      links: links || [],
      commissions: commissions || [],
      payouts: payouts || [],
    });
  } catch (error) {
    console.error("[admin/referrals/[affiliateId]] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate" },
      { status: 500 },
    );
  }
}
