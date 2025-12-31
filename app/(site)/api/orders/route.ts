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

    const { items, total, appliedCoupon, discount, shippingAddress } =
      await request.json();

    // Get customer_id from customers table
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_id: customer.id,
        total,
        discount: discount || 0,
        coupon_code: appliedCoupon?.code || null,
        shipping_address: JSON.stringify(shippingAddress),
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Save/update customer's shipping address
    if (shippingAddress) {
      // Check if address already exists
      const { data: existingAddress } = await supabase
        .from("addresses")
        .select("id")
        .eq("customer_id", customer.id)
        .eq("type", "shipping")
        .single();

      if (existingAddress) {
        // Update existing address
        await supabase
          .from("addresses")
          .update({
            full_name: shippingAddress.full_name,
            address_line1: shippingAddress.address_line1,
            address_line2: shippingAddress.address_line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal_code,
            country: shippingAddress.country,
          })
          .eq("id", existingAddress.id);
      } else {
        // Create new address
        await supabase.from("addresses").insert({
          customer_id: customer.id,
          type: "shipping",
          is_default: true,
          full_name: shippingAddress.full_name,
          address_line1: shippingAddress.address_line1,
          address_line2: shippingAddress.address_line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
        });
      }
    }

    // Create order items
    const orderItems = items.map(
      (item: { id: string; quantity: number; price: number }) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("[v0] Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
