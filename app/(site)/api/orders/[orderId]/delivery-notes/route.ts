import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Update the delivery notes on an order owned by the current user.
 * Only allowed while the order hasn't shipped yet — once it's on its way
 * there's no point changing courier instructions.
 */
export async function PATCH(
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

    const body = await request.json();
    const deliveryNotes =
      typeof body?.delivery_notes === "string"
        ? body.delivery_notes.trim().slice(0, 300)
        : null;

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!["pending", "processing"].includes(order.status)) {
      return NextResponse.json(
        {
          error: `Delivery notes can no longer be updated once the order is ${order.status}`,
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ delivery_notes: deliveryNotes || null })
      .eq("id", orderId);

    if (updateError) {
      console.error("[DELIVERY NOTES] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update delivery notes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, delivery_notes: deliveryNotes });
  } catch (error) {
    console.error("[DELIVERY NOTES] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update delivery notes",
      },
      { status: 500 },
    );
  }
}
