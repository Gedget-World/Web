import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getCashfreePaymentStatus,
  verifyCashfreeWebhookSignature,
} from "@/lib/cashfree";

// Maps Cashfree's raw payment status to our business-facing orders.status.
// Unlike the old version, USER_DROPPED / VOID / FLAGGED no longer silently
// collapse into "pending" indistinguishably from a brand-new order:
//  - USER_DROPPED / FLAGGED / PENDING / NOT_ATTEMPTED: order stays
//    "pending" (customer can still retry, or it needs manual review for
//    FLAGGED) — the distinct signal lives in payment_status instead.
//  - FAILED / TERMINATED / EXPIRED / VOID / CANCELLED: the payment attempt
//    is dead, so the order moves to "payment_failed" (distinct from the
//    user/admin-initiated "cancelled" status used by /api/orders/[id]/cancel).
function mapCashfreeStatusToOrderStatus(status?: string) {
  const normalized = (status || "").toUpperCase();

  // "processing" (not "confirmed") is used here because that is the only
  // vocabulary the rest of the app (admin dashboard, orders list, order
  // detail progress bar) understands for a paid/accepted order awaiting
  // fulfillment. Using an unrecognized status value breaks status badges,
  // colors, and the progress timeline everywhere else.
  if (["PAID", "CAPTURED", "SUCCESS"].includes(normalized)) {
    return "processing";
  }

  if (
    ["FAILED", "TERMINATED", "EXPIRED", "VOID", "CANCELLED"].includes(
      normalized,
    )
  ) {
    return "payment_failed";
  }

  // FLAGGED (held for risk review), USER_DROPPED, PENDING, NOT_ATTEMPTED
  return "pending";
}

// Normalizes Cashfree's raw payment status (plus our own COD advance
// concept) into the lowercase enum enforced by the
// orders_payment_status_check constraint. This is what actually fixes the
// "everything looks the same" problem — FLAGGED, USER_DROPPED and VOID
// each get their own distinct, queryable value instead of being
// overwritten with an ambiguous raw string.
function mapCashfreePaymentStatus(
  status: string | undefined,
  isCod: boolean,
): string {
  const normalized = (status || "").toUpperCase();

  if (["PAID", "CAPTURED", "SUCCESS"].includes(normalized)) {
    return isCod ? "advance_paid" : "paid";
  }
  if (["FAILED", "TERMINATED", "EXPIRED"].includes(normalized)) {
    return "failed";
  }
  if (normalized === "USER_DROPPED") return "user_dropped";
  if (normalized === "VOID") return "void";
  if (normalized === "FLAGGED") return "flagged";
  if (normalized === "CANCELLED") return "cancelled";
  // NOT_ATTEMPTED / PENDING / anything unrecognized
  return "pending";
}

/**
 * Webhook endpoint to receive payment updates from Cashfree
 * Cashfree will POST to this endpoint whenever a payment status changes
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || "{}");
    console.log("[CASHFREE WEBHOOK] Received webhook:", body);

    // Optional signature verification (best-effort; do not block if header absent)
    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-cashfree-signature") ||
      "";
    if (signature && process.env.CASHFREE_VERIFY_SIGNATURE === "true") {
      const ok = verifyCashfreeWebhookSignature(body, signature);
      if (!ok) {
        console.warn("[CASHFREE WEBHOOK] Invalid signature, rejecting");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    // Webhook is server-to-server: use service role to bypass RLS.
    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = await createClient();
    }

    // Cashfree's webhook payload nests data under `data` for newer API versions.
    const data = body?.data || body;
    const order = data?.order || data;
    const payment = data?.payment || data;

    const order_id = order?.order_id || data?.order_id || body?.order_id;
    const order_status =
      order?.order_status ||
      payment?.payment_status ||
      data?.order_status ||
      body?.order_status;
    // The specific channel Cashfree used to process the payment (e.g.
    // "upi", "credit_card", "net_banking"). This must NOT be written to
    // `orders.payment_method`, which stores our own "cod"/"online" order
    // type and is relied on elsewhere to detect COD orders — overwriting
    // it here previously broke that detection once a COD advance payment
    // was confirmed.
    const payment_channel =
      payment?.payment_group ||
      payment?.payment_method ||
      data?.payment_method ||
      body?.payment_method ||
      null;
    const transaction_id =
      payment?.bank_reference ||
      payment?.transaction_id ||
      data?.transaction_id ||
      body?.transaction_id ||
      null;
    const cf_payment_id =
      payment?.cf_payment_id ||
      data?.cf_payment_id ||
      body?.cf_payment_id ||
      null;

    if (!order_id || !order_status) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 },
      );
    }

    // Load existing order to merge metadata + enforce idempotency, and to
    // know whether this is a COD order (advance_paid) or a fully-online one
    // (paid).
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status, payment_status, payment_method, metadata, paid_at")
      .eq("id", order_id)
      .single();

    if (!existingOrder) {
      console.warn("[CASHFREE WEBHOOK] Order not found for id:", order_id);
      // Acknowledge so Cashfree doesn't keep retrying.
      return NextResponse.json({ success: true, ignored: true });
    }

    const isCod = existingOrder.payment_method === "cod";
    const mappedStatus = mapCashfreeStatusToOrderStatus(order_status);
    const mappedPaymentStatus = mapCashfreePaymentStatus(order_status, isCod);

    // Idempotency: skip if already in a terminal state matching this update.
    if (
      existingOrder.status === mappedStatus &&
      existingOrder.payment_status === mappedPaymentStatus &&
      (mappedStatus === "processing" || mappedStatus === "payment_failed")
    ) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const mergedMetadata = {
      ...(existingOrder?.metadata || {}),
      payment_channel: payment_channel,
      transaction_id: transaction_id,
      cf_payment_id: cf_payment_id,
      cashfree_status: order_status,
      webhook_received_at: new Date().toISOString(),
    };

    // Update order with normalized payment details
    const updatePayload: Record<string, any> = {
      status: mappedStatus,
      payment_status: mappedPaymentStatus,
      payment_gateway: "cashfree",
      metadata: mergedMetadata,
    };

    if (payment_channel) updatePayload.payment_channel = payment_channel;
    if (transaction_id) updatePayload.transaction_id = transaction_id;
    if (cf_payment_id) updatePayload.cf_payment_id = cf_payment_id;
    if (mappedStatus === "processing") {
      updatePayload.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
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

    // Fetch live payment status from Cashfree if a session was created for
    // this order. Cashfree's GET /pg/orders/{order_id} endpoint expects
    // *our* order id (which we set as Cashfree's order_id at session
    // creation time) — NOT the payment_session_id token, which is a
    // completely different opaque value and would 404 against this API.
    if (order.payment_session_id) {
      const paymentStatus = await getCashfreePaymentStatus(order.id);

      const cashfreeStatus =
        paymentStatus?.order_status ||
        paymentStatus?.payment_status ||
        "PENDING";
      const mappedOrderStatus = mapCashfreeStatusToOrderStatus(cashfreeStatus);
      const mappedPaymentStatus = mapCashfreePaymentStatus(
        cashfreeStatus,
        order.payment_method === "cod",
      );

      // Keep DB order state in sync even if webhook is delayed/missed.
      if (
        order.status !== mappedOrderStatus ||
        order.payment_status !== mappedPaymentStatus
      ) {
        const reconcilePayload: Record<string, any> = {
          status: mappedOrderStatus,
          payment_status: mappedPaymentStatus,
          payment_gateway: "cashfree",
          metadata: {
            ...(order.metadata || {}),
            cashfree_status: cashfreeStatus,
            status_checked_at: new Date().toISOString(),
          },
        };

        if (mappedOrderStatus === "processing" && !order.paid_at) {
          reconcilePayload.paid_at = new Date().toISOString();
        }

        await supabase
          .from("orders")
          .update(reconcilePayload)
          .eq("id", order.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          ...paymentStatus,
          order_id: order.id,
          order_status: cashfreeStatus,
          internal_order_status: mappedOrderStatus,
        },
      });
    }

    // Return current order status
    const fallbackCashfreeStatus =
      order.status === "processing"
        ? "PAID"
        : order.status === "cancelled"
          ? "FAILED"
          : "PENDING";

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        status: order.status,
        order_status: fallbackCashfreeStatus,
        internal_order_status: order.status,
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
