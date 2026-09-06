import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";
import { generateReferralCode } from "@/lib/referrals";

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

// GET — paginated list of affiliate applications, optionally filtered by status.
export async function GET(request: NextRequest) {
  try {
    const { isValid } = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = Math.max(0, Number(searchParams.get("page")) || 0);
    const limit = Number(searchParams.get("limit")) || 10;

    const supabase = createServiceClient();
    let query = supabase
      .from("affiliates")
      .select("*, customers(first_name, last_name, phone)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(page * limit, page * limit + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], count: count || 0 });
  } catch (error) {
    console.error("[admin/referrals/applications] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

// PATCH — approve / reject / suspend an affiliate application.
export async function PATCH(request: NextRequest) {
  try {
    const { isValid, adminId } = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, reason } = body as {
      id: string;
      action: "approve" | "reject" | "suspend" | "reinstate";
      reason?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    if (action === "approve") {
      const { data: existing } = await supabase
        .from("affiliates")
        .select("referral_code")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("affiliates")
        .update({
          status: "approved",
          referral_code: existing?.referral_code || generateReferralCode(),
          approved_at: new Date().toISOString(),
          approved_by_admin_id: adminId,
          rejected_reason: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ affiliate: data });
    }

    if (action === "reject") {
      const { data, error } = await supabase
        .from("affiliates")
        .update({ status: "rejected", rejected_reason: reason || null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ affiliate: data });
    }

    if (action === "suspend") {
      const { data, error } = await supabase
        .from("affiliates")
        .update({ status: "suspended" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ affiliate: data });
    }

    if (action === "reinstate") {
      const { data, error } = await supabase
        .from("affiliates")
        .update({ status: "approved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ affiliate: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/referrals/applications] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}
