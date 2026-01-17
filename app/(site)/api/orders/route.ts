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

    // Save address to addresses table if metadata contains shipping details
    if (metadata?.shipping_state && customer) {
      try {
        // Check if address already exists
        const { data: existingAddress } = await supabase
          .from("addresses")
          .select("id")
          .eq("customer_id", customer.id)
          .eq("type", "shipping")
          .single();

        // Parse address safely
        const addressParts = shipping_address
          ? shipping_address.split(",")
          : [""];
        const addressData = {
          full_name: customer_name || "",
          address_line1: addressParts[0]?.trim() || "",
          address_line2: addressParts[1]?.trim() || "",
          city: shipping_city || "",
          state: metadata.shipping_state || "",
          postal_code: shipping_postal_code || "",
          country: shipping_country || "US",
        };

        if (existingAddress) {
          // Update existing address
          await supabase
            .from("addresses")
            .update(addressData)
            .eq("id", existingAddress.id);
        } else {
          // Create new address
          await supabase.from("addresses").insert({
            customer_id: customer.id,
            type: "shipping",
            is_default: true,
            ...addressData,
          });
        }
      } catch (addressError) {
        console.error("[DEBUG] Address creation/update error:", addressError);
        // Don't fail the order if address fails
      }
    }

    // Validate order items
    if (
      !order_items ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      );
    }

    // Create order items
    const orderItems = order_items.map(
      (item: { product_id: string; quantity: number; price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })
    );

    console.log("[DEBUG] Creating order items:", orderItems);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[DEBUG] Order items creation error:", itemsError);
      throw itemsError;
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
      { status: 500 }
    );
  }
}
