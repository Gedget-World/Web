import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CourierNotConfiguredError,
  InvalidTrackingIdError,
  ShippingPartner,
  deriveOrderStatus,
  getCourierAdapter,
} from "@/lib/couriers";

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

// Re-fetches the live shipment status for an already-linked order from the
// courier's API. Does not touch shipping_partner/tracking_number/lock state.
export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    const supabase = createServiceClient();
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, shipping_partner, tracking_number, tracking_locked")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (
      !order.tracking_locked ||
      !order.shipping_partner ||
      !order.tracking_number
    ) {
      return NextResponse.json(
        { error: "No linked courier tracking found for this order." },
        { status: 400 },
      );
    }

    let result;
    try {
      const adapter = getCourierAdapter(
        order.shipping_partner as ShippingPartner,
      );
      result = await adapter.track(order.tracking_number);
    } catch (err) {
      if (
        err instanceof CourierNotConfiguredError ||
        err instanceof InvalidTrackingIdError
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("[TRACKING REFRESH] Courier lookup failed:", err);
      return NextResponse.json(
        {
          error:
            "Could not reach the courier's tracking service. Please try again shortly.",
        },
        { status: 502 },
      );
    }

    const newOrderStatus = deriveOrderStatus(
      order.status,
      result.shipmentStatus,
    );
    const updates: Record<string, unknown> = {
      shipment_status: result.shipmentStatus,
      updated_at: new Date().toISOString(),
    };
    if (newOrderStatus) updates.status = newOrderStatus;

    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      console.error("[TRACKING REFRESH] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to refresh tracking" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      shipment_status: result.shipmentStatus,
      status: newOrderStatus || order.status,
    });
  } catch (err) {
    console.error("[TRACKING REFRESH] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
