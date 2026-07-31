import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { carouselId } = await params;

    // Get carousel with placement
    const { data: carousel, error: carouselError } = await supabase
      .from("banner_carousels")
      .select(
        `
        *,
        content_placements (
          id,
          name,
          description,
          max_items
        )
      `,
      )
      .eq("id", carouselId)
      .single();

    if (carouselError || !carousel) {
      return NextResponse.json(
        { success: false, error: "Carousel not found" },
        { status: 404 },
      );
    }

    // Get banners in this carousel with order
    const { data: carouselBanners } = await supabase
      .from("carousel_banners")
      .select(
        `
        id,
        display_order,
        banner_id,
        banners (
          id,
          title,
          subtitle,
          desktop_image_url,
          tablet_image_url,
          mobile_image_url,
          link_url,
          is_active,
          alt_text
        )
      `,
      )
      .eq("carousel_id", carouselId)
      .order("display_order", { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...carousel,
        banners:
          carouselBanners?.map((cb) => ({
            ...cb.banners,
            display_order: cb.display_order,
            junction_id: cb.id,
          })) || [],
      },
    });
  } catch (error) {
    console.error("Carousel detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch carousel details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { carouselId } = await params;
    const body = await request.json();

    const {
      name,
      placement_id,
      auto_play,
      interval_ms,
      show_arrows,
      show_dots,
      infinite_loop,
      pause_on_hover,
      is_active,
      banner_ids, // Array of banner IDs in order
    } = body;

    // Update carousel
    const { data, error } = await supabase
      .from("banner_carousels")
      .update({
        name,
        placement_id: placement_id || null,
        auto_play,
        interval_ms,
        show_arrows,
        show_dots,
        infinite_loop,
        pause_on_hover,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carouselId)
      .select()
      .single();

    if (error) {
      console.error("Error updating carousel:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Update carousel banners if provided
    if (banner_ids !== undefined) {
      // Delete existing carousel banners
      await supabase
        .from("carousel_banners")
        .delete()
        .eq("carousel_id", carouselId);

      // Insert new carousel banners
      if (banner_ids.length > 0) {
        const carouselBanners = banner_ids.map(
          (bannerId: string, index: number) => ({
            carousel_id: carouselId,
            banner_id: bannerId,
            display_order: index,
          }),
        );

        const { error: bannersError } = await supabase
          .from("carousel_banners")
          .insert(carouselBanners);

        if (bannersError) {
          console.error("Error updating carousel banners:", bannersError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Carousel updated successfully",
    });
  } catch (error) {
    console.error("Carousel update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update carousel" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ carouselId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { carouselId } = await params;
    const body = await request.json();

    // For toggling is_active status
    const { is_active } = body;

    const { error } = await supabase
      .from("banner_carousels")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", carouselId);

    if (error) {
      console.error("Error toggling carousel status:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Carousel status updated",
    });
  } catch (error) {
    console.error("Carousel patch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update carousel status" },
      { status: 500 },
    );
  }
}
