import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", params.id)
      .single();

    if (customerError && customerError.code !== "PGRST116") {
      console.error("Error fetching customer:", customerError);
      return NextResponse.json(
        { error: customerError.message },
        { status: 400 },
      );
    }

    // Fetch customer's address if customer exists
    let address = null;
    if (customer) {
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("type", "shipping")
        .single();

      if (addressError && addressError.code !== "PGRST116") {
        console.error("Error fetching address:", addressError);
      } else {
        address = addressData;
      }
    }

    return NextResponse.json({ customer, address });
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
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
        preferences: body.preferences,
        marketing_consent: body.marketing_consent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
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
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", params.id);

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
