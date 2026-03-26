import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const { data } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    return NextResponse.json({
      success: true,
      exists: !!data,
    });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check email" },
      { status: 500 },
    );
  }
}
