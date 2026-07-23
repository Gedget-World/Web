import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all active collections
    const { data: collections, error } = await supabase
      .from("collections")
      .select(
        `
        id,
        name,
        slug,
        image_url
      `,
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Collections API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      collections: collections || [],
      total: (collections || []).length,
    });
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}
