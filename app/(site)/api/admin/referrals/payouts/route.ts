import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

async function validateAdminSession(): Promise<{
  isValid: boolean;
  adminId: string | null;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;
  if (!sessionToken) return { isValid: false, adminId: null };

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) return { isValid: false, adminId: null };
  if (new Date(session.expires_at) < new Date())
    return { isValid: false, adminId: null };
  return { isValid: true, adminId: session.admin_id };
}

// GET — either a per-affiliate summary of confirmed (payable) commissions,
// or, with ?affiliateId=, the individual confirmed commissions to select
// for a new payout. Also returns full payout history.
export async function GET(request: NextRequest) {
  try {
    const { isValid } = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliateId = request.nextUrl.searchParams.get("affiliateId");
    const supabase = createServiceClient();

    if (affiliateId) {
      const { data: commissions, error } = await supabase
        .from("referral_commissions")
        .select(
          "id, order_id, product_id, commission_amount, confirmed_at, products(name)",
        )
        .eq("affiliate_id", affiliateId)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ commissions: commissions || [] });
    }

    const [{ data: confirmed }, { data: payouts }] = await Promise.all([
      supabase
        .from("referral_commissions")
        .select(
          "affiliate_id, commission_amount, affiliates(referral_code, customers(first_name, last_name))",
        )
        .eq("status", "confirmed"),
      supabase
        .from("commission_payouts")
        .select(
          "*, affiliates(referral_code, customers(first_name, last_name))",
        )
        .order("created_at", { ascending: false }),
    ]);

    const summaryMap = new Map<
      string,
      {
        affiliateId: string;
        name: string;
        referralCode: string | null;
        totalDue: number;
        count: number;
      }
    >();
    (confirmed || []).forEach((row) => {
      const affiliate = row.affiliates as unknown as {
        referral_code: string | null;
        customers: {
          first_name: string | null;
          last_name: string | null;
        } | null;
      } | null;
      const existing = summaryMap.get(row.affiliate_id);
      const name = affiliate?.customers
        ? `${affiliate.customers.first_name || ""} ${affiliate.customers.last_name || ""}`.trim()
        : "Unknown";
      if (existing) {
        existing.totalDue += Number(row.commission_amount);
        existing.count += 1;
      } else {
        summaryMap.set(row.affiliate_id, {
          affiliateId: row.affiliate_id,
          name,
          referralCode: affiliate?.referral_code || null,
          totalDue: Number(row.commission_amount),
          count: 1,
        });
      }
    });

    return NextResponse.json({
      pendingPayouts: Array.from(summaryMap.values()),
      payouts: payouts || [],
    });
  } catch (error) {
    console.error("[admin/referrals/payouts] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 },
    );
  }
}

// POST — record a manual payout (admin already sent the money externally)
// for a specific set of confirmed commissions belonging to one affiliate.
export async function POST(request: NextRequest) {
  try {
    const { isValid, adminId } = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { affiliateId, commissionIds, payoutMethod, payoutReference, notes } =
      body as {
        affiliateId: string;
        commissionIds: string[];
        payoutMethod?: string;
        payoutReference?: string;
        notes?: string;
      };

    if (
      !affiliateId ||
      !Array.isArray(commissionIds) ||
      commissionIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing affiliateId or commissionIds" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { data: commissions, error: fetchError } = await supabase
      .from("referral_commissions")
      .select("id, commission_amount, status")
      .in("id", commissionIds)
      .eq("affiliate_id", affiliateId);

    if (fetchError) throw fetchError;

    const invalid = (commissions || []).find((c) => c.status !== "confirmed");
    if (
      !commissions ||
      commissions.length !== commissionIds.length ||
      invalid
    ) {
      return NextResponse.json(
        {
          error:
            "All selected commissions must belong to this affiliate and be confirmed",
        },
        { status: 400 },
      );
    }

    const totalAmount = commissions.reduce(
      (sum, c) => sum + Number(c.commission_amount),
      0,
    );

    const { data: payout, error: payoutError } = await supabase
      .from("commission_payouts")
      .insert({
        affiliate_id: affiliateId,
        total_amount: totalAmount,
        status: "paid",
        payout_method: payoutMethod || null,
        payout_reference: payoutReference || null,
        notes: notes || null,
        paid_at: new Date().toISOString(),
        created_by_admin_id: adminId,
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    const { error: updateError } = await supabase
      .from("referral_commissions")
      .update({ status: "paid", payout_id: payout.id })
      .in("id", commissionIds);

    if (updateError) throw updateError;

    return NextResponse.json({ payout });
  } catch (error) {
    console.error("[admin/referrals/payouts] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 },
    );
  }
}
