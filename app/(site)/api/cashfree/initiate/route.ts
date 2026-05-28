import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createCashfreePaymentSession,
  isValidCashfreePhoneNumber,
  normalizePhoneNumber,
} from "@/lib/cashfree";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, amount, customer_phone, customer_name } = body;

    if (!order_id || !amount || !customer_phone) {
      return NextResponse.json(
        {
          error: "Missing required fields: order_id, amount, customer_phone",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(String(customer_phone));
    if (!isValidCashfreePhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            "Invalid customer_phone. Use a valid number like +919090407368 or 9090407368.",
        },
        { status: 400 },
      );
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 },
      );
    }

    // Create Cashfree payment session
    console.log("[CASHFREE] Initiating payment session for order:", order_id);
    let paymentSession;
    try {
      paymentSession = await createCashfreePaymentSession({
        order_id,
        customer_email: user.email || "",
        customer_phone: normalizedPhone,
        amount,
        customer_name,
      });
      console.log(
        "[CASHFREE] Payment session created successfully:",
        paymentSession,
      );
    } catch (cashfreeError) {
      console.error(
        "[CASHFREE] Payment session creation failed:",
        cashfreeError,
      );
      throw cashfreeError;
    }

    // Store payment session info in database (optional, for tracking).
    // Use service role to ensure write succeeds regardless of RLS policies.
    if (paymentSession.order_id) {
      let writer;
      try {
        writer = createServiceClient();
      } catch {
        writer = supabase;
      }

      await writer
        .from("orders")
        .update({
          payment_gateway: "cashfree",
          payment_session_id: paymentSession.order_id,
          payment_status: "initiated",
          metadata: {
            ...(order.metadata || {}),
            cashfree_order_id: paymentSession.order_id,
            payment_initiated_at: new Date().toISOString(),
          },
        })
        .eq("id", order_id);
    }

    return NextResponse.json({
      success: true,
      data: paymentSession,
    });
  } catch (error) {
    console.error("[CASHFREE] Payment session error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create payment session";
    const errorStack = error instanceof Error ? error.stack : "";

    if (errorStack) {
      console.error("[CASHFREE] Error stack:", errorStack);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}
