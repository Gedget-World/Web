import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CourierNotConfiguredError,
  InvalidTrackingIdError,
  ShippingPartner,
  SHIPPING_PARTNER_LABELS,
  deriveOrderStatus,
  getCourierAdapter,
} from "@/lib/couriers";

const VALID_PARTNERS = Object.keys(
  SHIPPING_PARTNER_LABELS,
) as ShippingPartner[];

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

// Links a courier AWB/order ID to an order: verifies it against the
// courier's live API, then locks the fields (tracking_locked = true) so
// they can never be resubmitted from the admin UI once verified.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    const body = await request.json();
    const shippingPartner = body?.shippingPartner as ShippingPartner;
    const trackingNumber =
      typeof body?.trackingNumber === "string"
        ? body.trackingNumber.trim()
        : "";

    if (!VALID_PARTNERS.includes(shippingPartner)) {
      return NextResponse.json(
        { error: "Please select a valid courier partner." },
        { status: 400 },
      );
    }
    if (!trackingNumber || trackingNumber.length > 100) {
      return NextResponse.json(
        { error: "Please enter a valid AWB/order ID." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, tracking_locked")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.tracking_locked) {
      return NextResponse.json(
        { error: "Tracking is already linked and locked for this order." },
        { status: 409 },
      );
    }

    let result;
    try {
      const adapter = getCourierAdapter(shippingPartner);
      result = await adapter.track(trackingNumber);
    } catch (err) {
      if (
        err instanceof CourierNotConfiguredError ||
        err instanceof InvalidTrackingIdError
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("[TRACKING] Courier lookup failed:", err);
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
      shipping_partner: shippingPartner,
      tracking_number: trackingNumber,
      shipment_status: result.shipmentStatus,
      tracking_locked: true,
      updated_at: new Date().toISOString(),
    };
    if (newOrderStatus) updates.status = newOrderStatus;

    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      console.error("[TRACKING] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save tracking details" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      shipping_partner: shippingPartner,
      tracking_number: trackingNumber,
      shipment_status: result.shipmentStatus,
      tracking_locked: true,
      status: newOrderStatus || order.status,
    });
  } catch (err) {
    console.error("[TRACKING] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
