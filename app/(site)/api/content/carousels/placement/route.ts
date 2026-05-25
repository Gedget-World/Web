import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type CarouselRow = {
  id: string;
  name: string;
  auto_play: boolean;
  interval_ms: number;
  show_arrows: boolean;
  show_dots: boolean;
  infinite_loop: boolean;
  pause_on_hover: boolean;
  is_active: boolean;
};

type CarouselBannerRow = {
  display_order: number | null;
  banners: {
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
    alt_text: string | null;
    created_at: string | null;
  } | null;
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
      return NextResponse.json({ success: true, data: null });
    }

    const { data: carousels, error: carouselError } = await supabase
      .from("banner_carousels")
      .select(
        "id, name, auto_play, interval_ms, show_arrows, show_dots, infinite_loop, pause_on_hover, is_active, created_at",
      )
      .eq("placement_id", placement.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (carouselError) {
      console.error("Error fetching placement carousel:", carouselError);
      return NextResponse.json(
        { success: false, error: carouselError.message },
        { status: 500 },
      );
    }

    if (!carousels || carousels.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const carousel = carousels[0] as CarouselRow;

    const { data: carouselBanners, error: carouselBannersError } =
      await supabase
        .from("carousel_banners")
        .select(
          `
          display_order,
          banners (
            id,
            title,
            subtitle,
            desktop_image_url,
            desktop_width,
            desktop_height,
            tablet_image_url,
            mobile_image_url,
            link_url,
            link_target,
            link_text,
            text_color,
            overlay_color,
            text_position,
            start_date,
            end_date,
            is_active,
            alt_text,
            created_at
          )
        `,
        )
        .eq("carousel_id", carousel.id)
        .order("display_order", { ascending: true });

    if (carouselBannersError) {
      console.error("Error fetching carousel banners:", carouselBannersError);
      return NextResponse.json(
        { success: false, error: carouselBannersError.message },
        { status: 500 },
      );
    }

    const now = new Date();
    const filteredBanners = (carouselBanners as CarouselBannerRow[])
      .map((item) => item.banners)
      .filter((banner): banner is NonNullable<CarouselBannerRow["banners"]> => {
        if (!banner || !banner.is_active) {
          return false;
        }

        const starts = banner.start_date ? new Date(banner.start_date) : null;
        const ends = banner.end_date ? new Date(banner.end_date) : null;

        if (starts && starts > now) return false;
        if (ends && ends < now) return false;
        return true;
      });

    const limitedBanners =
      placement.max_items && placement.max_items > 0
        ? filteredBanners.slice(0, placement.max_items)
        : filteredBanners;

    return NextResponse.json({
      success: true,
      data: {
        ...carousel,
        banners: limitedBanners,
      },
    });
  } catch (error) {
    console.error("Placement carousel fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch placement carousel" },
      { status: 500 },
    );
  }
}
