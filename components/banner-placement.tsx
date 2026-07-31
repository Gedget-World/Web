// Server component — no "use client" directive intentionally
// Data is fetched on the server during RSC rendering, streamed via Suspense

import { createServiceClient } from "@/lib/supabase/service";
import { BannerCarousel } from "@/components/banner-carousel";
import { BannerList, type BannerItem } from "@/components/banner-list";
import type { PlacementCarousel } from "@/components/banner-carousel";

type RawBanner = BannerItem & {
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number | null;
  created_at: string | null;
};

type RawCarouselBannerRow = {
  display_order: number | null;
  banners: RawBanner | RawBanner[] | null;
};

// Fallback when a placement has no max_items set in the DB (matches the admin form's default).
const DEFAULT_MAX_ITEMS = 10;

async function fetchPlacementCarousel(
  placementName: string,
): Promise<PlacementCarousel | null> {
  const supabase = createServiceClient();

  const { data: placement } = await supabase
    .from("content_placements")
    .select("id, max_items")
    .eq("name", placementName)
    .single();

  if (!placement) return null;

  const { data: carousels } = await supabase
    .from("banner_carousels")
    .select(
      "id, name, auto_play, interval_ms, show_arrows, show_dots, infinite_loop, pause_on_hover, is_active, created_at",
    )
    .eq("placement_id", placement.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!carousels?.length) return null;

  const carousel = carousels[0];

  const { data: carouselBanners } = await supabase
    .from("carousel_banners")
    .select(
      `
      display_order,
      banners (
        id, title, subtitle,
        desktop_image_url, desktop_width, desktop_height,
        tablet_image_url, mobile_image_url,
        link_url, link_target, link_text,
        text_color, overlay_color, text_position,
        start_date, end_date, is_active, alt_text
      )
    `,
    )
    .eq("carousel_id", carousel.id)
    .order("display_order", { ascending: true });

  const now = new Date();
  const filteredBanners = (
    (carouselBanners ?? []) as unknown as RawCarouselBannerRow[]
  )
    .map((cb) => (Array.isArray(cb.banners) ? cb.banners[0] : cb.banners))
    .filter((b): b is RawBanner => {
      if (!b || !b.is_active) return false;
      if (b.start_date && new Date(b.start_date) > now) return false;
      if (b.end_date && new Date(b.end_date) < now) return false;
      return true;
    });

  const maxItems = placement.max_items ?? DEFAULT_MAX_ITEMS;
  const limitedBanners =
    maxItems > 0 ? filteredBanners.slice(0, maxItems) : filteredBanners;

  if (!limitedBanners.length) return null;

  return { ...carousel, banners: limitedBanners };
}

async function fetchPlacementBanners(
  placementName: string,
): Promise<BannerItem[]> {
  const supabase = createServiceClient();

  const { data: placement } = await supabase
    .from("content_placements")
    .select("id, max_items")
    .eq("name", placementName)
    .single();

  if (!placement) return [];

  const { data: banners } = await supabase
    .from("banners")
    .select(
      "id, title, subtitle, desktop_image_url, desktop_width, desktop_height, tablet_image_url, mobile_image_url, link_url, link_target, link_text, text_color, overlay_color, text_position, start_date, end_date, is_active, priority, alt_text, created_at",
    )
    .eq("placement_id", placement.id)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (!banners?.length) return [];

  const now = new Date();
  const active = (banners as RawBanner[]).filter((b) => {
    if (b.start_date && new Date(b.start_date) > now) return false;
    if (b.end_date && new Date(b.end_date) < now) return false;
    return true;
  });

  const maxItems = placement.max_items ?? DEFAULT_MAX_ITEMS;
  return maxItems > 0 ? active.slice(0, maxItems) : active;
}

export async function BannerPlacement({
  placementName,
}: {
  placementName: string;
}) {
  const carousel = await fetchPlacementCarousel(placementName);

  if (carousel) {
    return <BannerCarousel carousel={carousel} />;
  }

  const banners = await fetchPlacementBanners(placementName);

  if (banners.length) {
    return <BannerList banners={banners} />;
  }

  return null;
}
