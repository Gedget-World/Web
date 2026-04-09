import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all active collections with product counts
    const { data: collections, error } = await supabase
      .from("collections")
      .select(
        `
        id,
        name,
        slug,
        products:products(count)
      `,
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Collections API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 },
      );
    }

    // Transform data to include product count
    const collectionsWithCounts = (collections || []).map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      count: collection.products?.[0]?.count || 0,
    }));

    return NextResponse.json({
      collections: collectionsWithCounts,
      total: collectionsWithCounts.length,
    });
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}
