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
    const campaign = searchParams.get("campaign");

    // Build query
    let query = supabase
      .from("advertisements")
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
    if (campaign) {
      query = query.eq("campaign_name", campaign);
    }

    // Apply pagination
    query = query.range(page * limit, page * limit + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching advertisements:", error);
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
    console.error("Advertisements fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advertisements" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      name,
      ad_type,
      placement_id,
      desktop_content_url,
      desktop_width,
      desktop_height,
      tablet_content_url,
      tablet_width,
      tablet_height,
      mobile_content_url,
      mobile_width,
      mobile_height,
      html_content,
      click_url,
      click_target,
      tracking_pixel_url,
      start_date,
      end_date,
      max_impressions,
      max_clicks,
      is_active,
      priority,
      alt_text,
      campaign_name,
      created_by,
    } = body;

    if (!name || !desktop_content_url) {
      return NextResponse.json(
        { success: false, error: "Name and desktop content URL are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("advertisements")
      .insert([
        {
          name,
          ad_type: ad_type || "image",
          placement_id: placement_id || null,
          desktop_content_url,
          desktop_width,
          desktop_height,
          tablet_content_url,
          tablet_width,
          tablet_height,
          mobile_content_url,
          mobile_width,
          mobile_height,
          html_content,
          click_url,
          click_target: click_target || "_blank",
          tracking_pixel_url,
          start_date: start_date || null,
          end_date: end_date || null,
          max_impressions,
          max_clicks,
          is_active: is_active ?? true,
          priority: priority || 0,
          alt_text,
          campaign_name,
          created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating advertisement:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Advertisement created successfully",
    });
  } catch (error) {
    console.error("Advertisement creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create advertisement" },
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
        { success: false, error: "Advertisement ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting advertisement:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    console.error("Advertisement delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete advertisement" },
      { status: 500 },
    );
  }
}
