import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", id)
      .single();

    if (customerError && customerError.code !== "PGRST116") {
      console.error("Error fetching customer:", customerError);
      return NextResponse.json(
        { error: customerError.message },
        { status: 400 },
      );
    }

    // Fetch customer's saved shipping addresses if customer exists.
    // Customers can now have multiple saved addresses, so this can no
    // longer use `.single()` (which errors on 0 or 2+ rows).
    let address = null;
    let addresses: Record<string, unknown>[] = [];
    if (customer) {
      const { data: addressList, error: addressError } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("type", "shipping")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (addressError) {
        console.error("Error fetching addresses:", addressError);
      } else {
        addresses = addressList || [];
        address = addresses[0] || null;
      }
    }

    return NextResponse.json({ customer, address, addresses });
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Phone / phone_verified are intentionally excluded — they can only be
    // changed by the auth-sync triggers (see 018_sync_customer_auth_metadata.sql
    // and 019_secure_customer_profile.sql), never by this endpoint.
    // The user_id filter also ensures customers can only ever update their own row.
    const { data, error } = await supabase
      .from("customers")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        preferences: body.preferences,
        marketing_consent: body.marketing_consent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating customer:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting customer:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
