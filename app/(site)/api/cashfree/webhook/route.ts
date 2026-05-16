import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCashfreePaymentStatus } from "@/lib/cashfree";

/**
 * Webhook endpoint to receive payment updates from Cashfree
 * Cashfree will POST to this endpoint whenever a payment status changes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[CASHFREE WEBHOOK] Received webhook:", body);

    const supabase = await createClient();

    // Extract order information from webhook
    const {
      order_id,
      order_amount,
      order_status,
      payment_method,
      transaction_id,
      cf_payment_id,
      customer_email,
    } = body;

    if (!order_id || !order_status) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 },
      );
    }

    // Map Cashfree status to our order status
    let orderStatus = "pending";
    if (order_status === "PAID" || order_status === "CAPTURED") {
      orderStatus = "confirmed";
    } else if (order_status === "FAILED" || order_status === "CANCELLED") {
      orderStatus = "cancelled";
    } else if (order_status === "PENDING") {
      orderStatus = "pending";
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        metadata: {
          payment_method: payment_method,
          transaction_id: transaction_id,
          cf_payment_id: cf_payment_id,
          cashfree_status: order_status,
          webhook_received_at: new Date().toISOString(),
        },
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("[CASHFREE WEBHOOK] Error updating order:", updateError);
      throw updateError;
    }

    // Acknowledge receipt of webhook
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CASHFREE WEBHOOK] Error processing webhook:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to fetch payment status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 },
      );
    }

    // Fetch payment status from Cashfree if payment_session_id exists
    if (order.payment_session_id) {
      const paymentStatus = await getCashfreePaymentStatus(
        order.payment_session_id,
      );
      return NextResponse.json({
        success: true,
        data: paymentStatus,
      });
    }

    // Return current order status
    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("[CASHFREE] Payment status error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment status",
      },
      { status: 500 },
    );
  }
}
