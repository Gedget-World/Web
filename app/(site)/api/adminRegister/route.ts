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
    if (data) {
      error = "Email already exists";
      return NextResponse.json({ success: false, error, status: 400 });
    }

    let userData = null;
    // Create new admin/user
    if (!data) {
      const { data, error } = await supabase
        .from("admins")
        .insert([
          {
            email: email,
            password_hash: password,
            name: "Admin",
          },
        ])
        .select();

      userData = data;
      if (error) {
        console.error("Error inserting admin:", error);
      } else {
        console.log("Admin created:", data);
      }
    }

    return NextResponse.json({ success: true, data: userData, status: 201 });
  } catch (error) {
    console.error("[v0] Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
