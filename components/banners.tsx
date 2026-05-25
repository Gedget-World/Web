"use client";

import { useEffect, useState } from "react";
import {
  BannerCarousel,
  type PlacementCarousel,
} from "@/components/banner-carousel";
import { BannerList, type BannerItem } from "@/components/banner-list";

type BannersResponse = {
  success: boolean;
  data?: BannerItem[];
};

type CarouselResponse = {
  success: boolean;
  data: PlacementCarousel | null;
};

export function Banners({ placementName }: { placementName: string }) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [carousel, setCarousel] = useState<PlacementCarousel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [carouselRes, bannersRes] = await Promise.all([
          fetch(
            `/api/content/carousels/placement?placementName=${encodeURIComponent(placementName)}`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/content/banners/placement?placementName=${encodeURIComponent(placementName)}`,
            { cache: "no-store" },
          ),
        ]);

        const [carouselJson, bannersJson]: [CarouselResponse, BannersResponse] =
          await Promise.all([carouselRes.json(), bannersRes.json()]);

        if (isMounted) {
          const hasCarouselBanners = Boolean(
            carouselJson.data?.banners?.length,
          );

          setCarousel(hasCarouselBanners ? carouselJson.data : null);
          setBanners(
            hasCarouselBanners
              ? []
              : bannersJson.success
                ? (bannersJson.data ?? [])
                : [],
          );
        }
      } catch (error) {
        console.error("Failed to load placement banners:", error);
        if (isMounted) {
          setCarousel(null);
          setBanners([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [placementName]);

  if (loading || (banners.length === 0 && !carousel?.banners?.length)) {
    return null;
  }

  if (carousel?.banners?.length) {
    return <BannerCarousel carousel={carousel} />;
  }

  return <BannerList banners={banners} />;
}
