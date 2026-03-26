import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { bannerId } = await params;

    const { data, error } = await supabase
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
      )
      .eq("id", bannerId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Banner detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banner details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { bannerId } = await params;
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
    } = body;

    const { data, error } = await supabase
      .from("banners")
      .update({
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
        link_target,
        link_text,
        text_color,
        overlay_color,
        text_position,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active,
        priority,
        alt_text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bannerId)
      .select()
      .single();

    if (error) {
      console.error("Error updating banner:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Banner updated successfully",
    });
  } catch (error) {
    console.error("Banner update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { bannerId } = await params;
    const body = await request.json();

    // For toggling is_active status
    const { is_active } = body;

    const { error } = await supabase
      .from("banners")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", bannerId);

    if (error) {
      console.error("Error updating banner status:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Banner status updated successfully",
    });
  } catch (error) {
    console.error("Banner status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner status" },
      { status: 500 },
    );
  }
}
