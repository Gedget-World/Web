import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ adId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { adId } = await params;

    // Get advertisement with placement
    const { data: ad, error: adError } = await supabase
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
      )
      .eq("id", adId)
      .single();

    if (adError || !ad) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 },
      );
    }

    // Get analytics stats
    const { data: stats } = await supabase.rpc("get_ad_stats", {
      p_ad_id: adId,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...ad,
        stats: stats?.[0] || null,
      },
    });
  } catch (error) {
    console.error("Advertisement detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advertisement details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ adId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { adId } = await params;
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
    } = body;

    const { data, error } = await supabase
      .from("advertisements")
      .update({
        name,
        ad_type,
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
        click_target,
        tracking_pixel_url,
        start_date: start_date || null,
        end_date: end_date || null,
        max_impressions,
        max_clicks,
        is_active,
        priority,
        alt_text,
        campaign_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adId)
      .select()
      .single();

    if (error) {
      console.error("Error updating advertisement:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Advertisement updated successfully",
    });
  } catch (error) {
    console.error("Advertisement update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update advertisement" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ adId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { adId } = await params;
    const body = await request.json();

    // For toggling is_active status
    const { is_active } = body;

    const { error } = await supabase
      .from("advertisements")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", adId);

    if (error) {
      console.error("Error updating advertisement status:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement status updated successfully",
    });
  } catch (error) {
    console.error("Advertisement status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update advertisement status" },
      { status: 500 },
    );
  }
}
