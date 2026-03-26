import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const placement = searchParams.get("placement");
    const active = searchParams.get("active");

    // Build query
    let query = supabase
      .from("banners")
      .select(
        `
        *,
        content_placements (
          id,
          name,
          description
        )
      `,
        { count: "exact" },
      )
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (placement) {
      query = query.eq("placement_id", placement);
    }
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    // Apply pagination
    query = query.range(page * limit, page * limit + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching banners:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Banners fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      title,
      subtitle,
      placement_id,
      desktop_image_url,
      desktop_width,
      desktop_height,
      tablet_image_url,
      tablet_width,
      tablet_height,
      mobile_image_url,
      mobile_width,
      mobile_height,
      link_url,
      link_target,
      link_text,
      text_color,
      overlay_color,
      text_position,
      start_date,
      end_date,
      is_active,
      priority,
      alt_text,
      created_by,
    } = body;

    if (!title || !desktop_image_url) {
      return NextResponse.json(
        { success: false, error: "Title and desktop image are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("banners")
      .insert([
        {
          title,
          subtitle,
          placement_id: placement_id || null,
          desktop_image_url,
          desktop_width,
          desktop_height,
          tablet_image_url,
          tablet_width,
          tablet_height,
          mobile_image_url,
          mobile_width,
          mobile_height,
          link_url,
          link_target: link_target || "_self",
          link_text,
          text_color: text_color || "#ffffff",
          overlay_color,
          text_position: text_position || "center",
          start_date: start_date || null,
          end_date: end_date || null,
          is_active: is_active ?? true,
          priority: priority || 0,
          alt_text,
          created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating banner:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Banner created successfully",
    });
  } catch (error) {
    console.error("Banner creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Banner ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      console.error("Error deleting banner:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete banner" },
      { status: 500 },
    );
  }
}
