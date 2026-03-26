import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("content_placements")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching placements:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Placements fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch placements" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const { name, description, max_items } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Placement name is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("content_placements")
      .insert([{ name, description, max_items: max_items || 1 }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "A placement with this name already exists",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Placement created successfully",
    });
  } catch (error) {
    console.error("Placement creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create placement" },
      { status: 500 },
    );
  }
}
