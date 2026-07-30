import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("user_id");

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!customer) {
      return NextResponse.json({ addresses: [] });
    }

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ addresses: addresses || [] });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

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

    const type = address.type || "shipping";

    // Editing an existing saved address (ownership enforced via customer_id)
    if (address.id) {
      const wantsDefault = address.is_default === true;

      if (wantsDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", customer.id)
          .eq("type", type)
          .neq("id", address.id);
      }

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
          ...(wantsDefault ? { is_default: true } : {}),
        })
        .eq("id", address.id)
        .eq("customer_id", customer.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        address: data,
        action: "updated",
      });
    }

    // Creating a brand-new address — customers can now save multiple
    // addresses per type instead of a single one being overwritten each time.
    const { count } = await supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customer.id)
      .eq("type", type);

    // The very first address of a given type is always the default one.
    const isDefault = address.is_default === true || !count;

    if (isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", customer.id)
        .eq("type", type);
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        customer_id: customer.id,
        type,
        is_default: isDefault,
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

    return NextResponse.json({
      success: true,
      address: data,
      action: "created",
    });
  } catch (error) {
    console.error("Error saving address:", error);
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id, address_id } = await request.json();

    if (!user_id || user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!address_id) {
      return NextResponse.json(
        { error: "address_id is required" },
        { status: 400 },
      );
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Confirm the address belongs to this customer before deleting
    const { data: addressToDelete } = await supabase
      .from("addresses")
      .select("id, type, is_default")
      .eq("id", address_id)
      .eq("customer_id", customer.id)
      .single();

    if (!addressToDelete) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("addresses")
      .delete()
      .eq("id", address_id)
      .eq("customer_id", customer.id);

    if (deleteError) throw deleteError;

    // If the deleted address was the default, promote the most recent
    // remaining address of the same type to be the new default.
    if (addressToDelete.is_default) {
      const { data: remaining } = await supabase
        .from("addresses")
        .select("id")
        .eq("customer_id", customer.id)
        .eq("type", addressToDelete.type)
        .order("created_at", { ascending: false })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
