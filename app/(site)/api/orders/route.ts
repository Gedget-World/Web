import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_country,
      coupon_code,
      discount_amount,
      order_items,
      metadata,
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
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        discount_amount: discount_amount || 0,
        coupon_code: coupon_code || null,
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

    // Decrease stock for each product
    for (const item of order_items) {
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        product_id: item.product_id,
        quantity: item.quantity,
      });

      if (stockError) {
        console.error(
          "[DEBUG] Stock update error for product:",
          item.product_id,
          stockError,
        );
        // If RPC doesn't exist, try direct update
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await supabase
            .from("products")
            .update({
              stock: newStock,
              is_out_of_stock: newStock <= 0,
            })
            .eq("id", item.product_id);
        }
      }
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
