import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
// import { HeroSection } from "@/components/hero-section";
import { HomePageSections } from "@/components/home-page-sections";
import { BannerPlacement } from "@/components/banner-placement";
import { BannerSkeleton } from "@/components/banner-list";
import { SectionSkeleton } from "@/components/lazy-section";
import type { LegacyHomePageSection } from "@/lib/types/home-page-sections";

const LOG_SOURCE = "app/(site)/page";

export default async function HomePage() {
  try {
    const supabase = await createClient();

    const { data: homeSectionsSetting } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("setting_key", "home_page_sections")
      .maybeSingle();

    // Admin-managed "Manage Home Page" sections — the saved JSON carries a
    // display snapshot per product, but stock/description are intentionally
    // left out of it, so full product details are still fetched fresh here.
    type ProductRow = {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      price: number;
      image_url: string | null;
      discount_percentage: number | null;
      is_featured: boolean;
      stock: number;
      is_out_of_stock: boolean;
      average_rating?: number;
      review_count?: number;
      reviews?: { rating: number }[];
    };
    let customSections: {
      id: string;
      title: string;
      products: ProductRow[];
    }[] = [];
    try {
      const parsedSections: LegacyHomePageSection[] =
        homeSectionsSetting?.setting_value
          ? JSON.parse(homeSectionsSetting.setting_value)
          : [];
      const allIds = Array.from(
        new Set(
          parsedSections.flatMap(
            (s) => s.products?.map((p) => p.id) ?? s.productIds ?? [],
          ),
        ),
      );

      let sectionProducts: ProductRow[] = [];
      if (allIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("*, reviews(rating)")
          .in("id", allIds)
          .eq("is_active", true);
        sectionProducts = data || [];

        const productMap = new Map(
          sectionProducts.map((p) => {
            const reviews = (p.reviews as { rating: number }[]) || [];
            const reviewCount = reviews.length;
            const averageRating =
              reviewCount > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : undefined;
            return [
              p.id,
              {
                ...p,
                average_rating: averageRating,
                review_count: reviewCount,
              },
            ];
          }),
        );

        customSections = parsedSections
          .map((s) => ({
            id: s.id,
            title: s.title,
            products: (s.products?.map((p) => p.id) ?? s.productIds ?? [])
              .map((id) => productMap.get(id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p)),
          }))
          .filter((s) => s.products.length > 0);
      }
    } catch (error) {
      void logger.error("Failed to load custom home page sections", {
        source: LOG_SOURCE,
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    void logger.info("Homepage viewed", {
      source: LOG_SOURCE,
    });

    return (
      <main className="min-h-screen">
        {/* <HeroSection /> */}

        {/* Streams in independently — page shell renders immediately */}
        <Suspense fallback={<BannerSkeleton />}>
          <BannerPlacement
            placementName="home-page-below-hero-section"
            priority
          />
        </Suspense>

        <HomePageSections customSections={customSections} />

        {/* Streams in independently */}
        <Suspense fallback={<SectionSkeleton height="220px" />}>
          <BannerPlacement placementName="home-page-above-footer" />
        </Suspense>
      </main>
    );
  } catch (error) {
    // Unexpected failure (e.g. Supabase client/network) — log then rethrow so
    // Next.js's error boundary still handles the user-facing error page.
    await logger.fatal("Unexpected error rendering homepage", {
      source: LOG_SOURCE,
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
