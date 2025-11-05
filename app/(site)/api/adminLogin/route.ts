import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { email, password } = await request.json();
    let error = null;

    // Check if admin with the same email already exists
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (!data || data.password_hash !== password) {
      error = "Invalid email or password";
      return NextResponse.json({ success: false, error, status: 400 });
    }

    return NextResponse.json({ success: true, data, status: 201 });
  } catch (error) {
    console.error("[v0] Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
