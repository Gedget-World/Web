import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { PayoutDetails, PayoutMethod } from "@/lib/types/referrals";

const MAX_MESSAGE_LENGTH = 1000;

function validatePayoutDetails(
  method: PayoutMethod,
  details: PayoutDetails,
): string | null {
  if (method === "upi") {
    if (!details.upi_id || !details.upi_id.trim()) return "UPI ID is required";
    return null;
  }
  if (method === "bank_transfer") {
    if (!details.account_holder_name?.trim())
      return "Account holder name is required";
    if (!details.account_number?.trim()) return "Account number is required";
    if (!details.ifsc_code?.trim()) return "IFSC code is required";
    return null;
  }
  return "Invalid payout method";
}

// GET — current user's affiliate application/status (or null if never applied).
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

    return NextResponse.json({ affiliate: affiliate || null });
  } catch (error) {
    console.error("[referrals/apply] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

// POST — apply to the affiliate program (or re-apply after a rejection).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH)
        : null;
    const payoutMethod = body?.payoutMethod as PayoutMethod;
    const payoutDetails = (body?.payoutDetails || {}) as PayoutDetails;

    if (payoutMethod !== "bank_transfer" && payoutMethod !== "upi") {
      return NextResponse.json(
        { error: "Invalid payout method" },
        { status: 400 },
      );
    }
    const validationError = validatePayoutDetails(payoutMethod, payoutDetails);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("affiliates")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      if (existing.status !== "rejected") {
        return NextResponse.json(
          {
            error: `You already have a ${existing.status} application`,
            affiliate: existing,
          },
          { status: 409 },
        );
      }

      // Re-applying after a rejection requires bypassing RLS (no client-side
      // UPDATE policy on affiliates — see scripts/036 for the rationale).
      const service = createServiceClient();
      const { data: updated, error: updateError } = await service
        .from("affiliates")
        .update({
          status: "pending",
          application_message: message,
          payout_method: payoutMethod,
          payout_details: payoutDetails,
          rejected_reason: null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ affiliate: updated });
    }

    const { data: created, error: insertError } = await supabase
      .from("affiliates")
      .insert({
        customer_id: customer.id,
        user_id: user.id,
        status: "pending",
        application_message: message,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json({ affiliate: created });
  } catch (error) {
    console.error("[referrals/apply] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
