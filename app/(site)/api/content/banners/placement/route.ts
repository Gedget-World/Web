import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string;
  desktop_width: number | null;
  desktop_height: number | null;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: string | null;
  link_text: string | null;
  text_color: string | null;
  overlay_color: string | null;
  text_position: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number | null;
  alt_text: string | null;
  created_at: string | null;
};

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const placementName = searchParams.get("placementName");

    if (!placementName) {
      return NextResponse.json(
        { success: false, error: "placementName is required" },
        { status: 400 },
      );
    }

    const { data: placement, error: placementError } = await supabase
      .from("content_placements")
      .select("id, max_items")
      .eq("name", placementName)
      .single();

    if (placementError || !placement) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: banners, error: bannersError } = await supabase
      .from("banners")
      .select(
        "id, title, subtitle, desktop_image_url, desktop_width, desktop_height, tablet_image_url, mobile_image_url, link_url, link_target, link_text, text_color, overlay_color, text_position, start_date, end_date, is_active, priority, alt_text, created_at",
      )
      .eq("placement_id", placement.id)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (bannersError) {
      console.error("Error fetching placement banners:", bannersError);
      return NextResponse.json(
        { success: false, error: bannersError.message },
        { status: 500 },
      );
    }

    const now = new Date();
    const activeBanners = (banners as BannerRow[]).filter((banner) => {
      const starts = banner.start_date ? new Date(banner.start_date) : null;
      const ends = banner.end_date ? new Date(banner.end_date) : null;

      if (starts && starts > now) return false;
      if (ends && ends < now) return false;
      return true;
    });

    const limitedBanners =
      placement.max_items && placement.max_items > 0
        ? activeBanners.slice(0, placement.max_items)
        : activeBanners;

    return NextResponse.json({ success: true, data: limitedBanners });
  } catch (error) {
    console.error("Placement banner fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch placement banners" },
      { status: 500 },
    );
  }
}
