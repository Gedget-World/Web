import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cancel a pending order owned by the current user.
 * Used when payment initiation fails so we don't leave ghost "pending" orders.
 * Only orders that are still `pending` and not yet paid can be cancelled here.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let reason = "user_cancelled";
    try {
      const body = await request.json();
      if (body?.reason) reason = String(body.reason);
    } catch {
      /* ignore empty body */
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, payment_status, user_id, metadata")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order is already ${order.status}` },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "cancelled",
        metadata: {
          ...(order.metadata || {}),
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        },
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[ORDER CANCEL] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel order" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORDER CANCEL] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 },
    );
  }
}
