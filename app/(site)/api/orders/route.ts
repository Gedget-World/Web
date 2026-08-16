import { createClient } from "@/lib/supabase/server";
import { notifyAdminNewOrder } from "@/lib/notify-admin";
import { NextResponse, after } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[DEBUG] Request body:", JSON.stringify(body, null, 2));

    const {
      total,
      status,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_country,
      coupon_code,
      discount_amount,
      order_items,
      metadata,
      is_gift,
      recipient_name,
      recipient_phone,
      notify_recipient,
      gift_message,
      hide_prices,
      gift_wrap,
      delivery_notes,
    } = body;

    // Get customer_id from customers table or create if doesn't exist
    let { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customer) {
      console.log("[DEBUG] Customer not found, creating new customer");
      // Create customer if doesn't exist
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          user_id: user.id,
          first_name: customer_name?.split(" ")[0] || "",
          last_name: customer_name?.split(" ").slice(1).join(" ") || "",
          email: customer_email || user.email,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("[DEBUG] Customer creation error:", createError);
        throw createError;
      }
      customer = newCustomer;
    }

    // Resolve payment method from metadata
    const paymentMethod = metadata?.payment_method || null;

    // Gift-related fields: recompute the wrap charge server-side rather
    // than trusting the client-supplied value, and clamp the message length.
    const isGift = Boolean(is_gift);
    const giftWrapCharge = isGift && gift_wrap ? 89 : 0;

    // COD orders require a 20% advance payment online, with the remaining
    // 80% collected as cash on delivery. Always recompute this split
    // server-side from `total` — never trust a client-supplied split, since
    // that would let a malicious client shrink the mandatory online advance.
    const isCod = paymentMethod === "cod";
    const ADVANCE_PERCENT = 0.2;
    const advanceAmount = isCod
      ? Math.round(Number(total) * ADVANCE_PERCENT * 100) / 100
      : null;
    const codAmount = isCod
      ? Math.round((Number(total) - (advanceAmount || 0)) * 100) / 100
      : null;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_id: customer.id,
        total,
        status: status || "pending",
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        discount_amount: discount_amount || 0,
        coupon_code: coupon_code || null,
        payment_method: paymentMethod,
        payment_status: isCod ? "advance_pending" : "pending",
        advance_amount: advanceAmount,
        cod_amount: codAmount,
        metadata: metadata || {},
        is_gift: isGift,
        recipient_name: isGift ? recipient_name || null : null,
        recipient_phone: isGift ? recipient_phone || null : null,
        notify_recipient: isGift ? Boolean(notify_recipient) : false,
        gift_message: isGift
          ? typeof gift_message === "string"
            ? gift_message.slice(0, 300)
            : null
          : null,
        hide_prices: isGift ? Boolean(hide_prices) : false,
        gift_wrap: isGift ? Boolean(gift_wrap) : false,
        gift_wrap_charge: giftWrapCharge,
        delivery_notes:
          typeof delivery_notes === "string" && delivery_notes.trim()
            ? delivery_notes.trim().slice(0, 300)
            : null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Validate order items
    if (
      !order_items ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 },
      );
    }

    // Create order items
    const orderItems = order_items.map(
      (item: { product_id: string; quantity: number; price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }),
    );

    console.log("[DEBUG] Creating order items:", orderItems);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[DEBUG] Order items creation error:", itemsError);
      throw itemsError;
    }

    // Increment coupon used_count if a coupon was applied
    if (coupon_code) {
      const { error: couponError } = await supabase.rpc(
        "increment_coupon_usage",
        {
          coupon_code_param: coupon_code,
        },
      );

      if (couponError) {
        console.error("[DEBUG] Coupon usage increment error:", couponError);
        // Fallback: direct update if RPC doesn't exist
        const { data: coupon } = await supabase
          .from("coupons")
          .select("id, used_count")
          .eq("code", coupon_code)
          .single();

        if (coupon) {
          await supabase
            .from("coupons")
            .update({ used_count: (coupon.used_count || 0) + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // Notify admins after the response is sent — never blocks/fails order creation.
    after(() =>
      notifyAdminNewOrder({
        orderId: order.id,
        total: Number(total),
        paymentMethod,
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        shippingCity: shipping_city,
        itemCount: orderItems.length,
        adminOrderUrl: `${
          process.env.NEXT_PUBLIC_APP_URL || "https://gadgetskabila.com"
        }/admin/dashboard/Orders/${order.id}`,
      }),
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order created successfully",
      paymentMethod: metadata?.payment_method,
    });
  } catch (error) {
    console.error("[ERROR] Order creation failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    );
  }
}
