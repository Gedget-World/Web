import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

// Validate admin session
async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;

  if (!sessionToken) {
    return false;
  }

  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return false;
  }

  if (new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("id");
    const supabase = createServiceClient();

    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: customerError?.message || "Customer not found" },
          { status: 404 },
        );
      }

      const [{ data: addresses }, { data: orders }] = await Promise.all([
        supabase
          .from("addresses")
          .select("*")
          .eq("customer_id", customerId)
          .order("is_default", { ascending: false }),
        supabase
          .from("orders")
          .select("id, total, status, created_at, customer_email")
          .eq("user_id", customer.user_id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return NextResponse.json({
        customer,
        addresses: addresses || [],
        orders: orders || [],
      });
    }

    const page = Number(searchParams.get("page") || "0");
    const limit = Number(searchParams.get("limit") || "10");

    const { count, error: countError } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customers: data, totalCount: count || 0 });
  } catch (error) {
    console.error("Error fetching admin customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
