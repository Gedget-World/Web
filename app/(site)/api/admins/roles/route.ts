import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Roles fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}
