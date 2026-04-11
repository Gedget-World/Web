import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id, address } = await request.json();

    // Verify the user_id matches the authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer_id from customers table, create if doesn't exist
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user_id)
      .single();

    // If customer doesn't exist, create one
    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          user_id: user_id,
          first_name: address.full_name?.split(" ")[0] || null,
          last_name: address.full_name?.split(" ").slice(1).join(" ") || null,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating customer:", createError);
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 },
        );
      }
      customer = newCustomer;
    }

    // Check if address already exists
    const { data: existingAddress } = await supabase
      .from("addresses")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("type", address.type || "shipping")
      .single();

    let result;
    if (existingAddress) {
      // Update existing address
      const { data, error } = await supabase
        .from("addresses")
        .update({
          full_name: address.full_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        })
        .eq("id", existingAddress.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new address
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          customer_id: customer.id,
          type: address.type || "shipping",
          is_default: address.is_default || true,
          full_name: address.full_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      address: result,
      action: existingAddress ? "updated" : "created",
    });
  } catch (error) {
    console.error("Error saving address:", error);
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 },
    );
  }
}
