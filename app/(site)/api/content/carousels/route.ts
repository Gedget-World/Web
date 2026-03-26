import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get total count
    const { count } = await supabase
      .from("banner_carousels")
      .select("*", { count: "exact", head: true });

    // Get carousels with placement info
    const { data, error } = await supabase
      .from("banner_carousels")
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
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error("Error fetching carousels:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Get banner counts for each carousel
    const carouselIds = data?.map((c) => c.id) || [];
    const { data: bannerCounts } = await supabase
      .from("carousel_banners")
      .select("carousel_id")
      .in("carousel_id", carouselIds);

    const countMap = bannerCounts?.reduce(
      (acc: Record<string, number>, item) => {
        acc[item.carousel_id] = (acc[item.carousel_id] || 0) + 1;
        return acc;
      },
      {},
    );

    const carouselsWithCounts = data?.map((carousel) => ({
      ...carousel,
      banner_count: countMap?.[carousel.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: carouselsWithCounts,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Carousels fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch carousels" },
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
      placement_id,
      auto_play,
      interval_ms,
      show_arrows,
      show_dots,
      infinite_loop,
      pause_on_hover,
      is_active,
      banner_ids, // Array of banner IDs with order
    } = body;

    // Create carousel
    const { data: carousel, error: carouselError } = await supabase
      .from("banner_carousels")
      .insert({
        name,
        placement_id: placement_id || null,
        auto_play: auto_play ?? true,
        interval_ms: interval_ms || 5000,
        show_arrows: show_arrows ?? true,
        show_dots: show_dots ?? true,
        infinite_loop: infinite_loop ?? true,
        pause_on_hover: pause_on_hover ?? true,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (carouselError) {
      console.error("Error creating carousel:", carouselError);
      return NextResponse.json(
        { success: false, error: carouselError.message },
        { status: 500 },
      );
    }

    // Add banners to carousel if provided
    if (banner_ids && banner_ids.length > 0) {
      const carouselBanners = banner_ids.map(
        (bannerId: string, index: number) => ({
          carousel_id: carousel.id,
          banner_id: bannerId,
          display_order: index,
        }),
      );

      const { error: bannersError } = await supabase
        .from("carousel_banners")
        .insert(carouselBanners);

      if (bannersError) {
        console.error("Error adding banners to carousel:", bannersError);
      }
    }

    return NextResponse.json({
      success: true,
      data: carousel,
      message: "Carousel created successfully",
    });
  } catch (error) {
    console.error("Carousel creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create carousel" },
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
        { success: false, error: "Carousel ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("banner_carousels")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting carousel:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Carousel deleted successfully",
    });
  } catch (error) {
    console.error("Carousel deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete carousel" },
      { status: 500 },
    );
  }
}
