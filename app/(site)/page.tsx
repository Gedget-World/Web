import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { HeroSection } from "@/components/hero-section";
import { HomePageSections } from "@/components/home-page-sections";
import { BannerPlacement } from "@/components/banner-placement";
import { SectionSkeleton } from "@/components/lazy-section";

const LOG_SOURCE = "app/(site)/page";

export default async function HomePage() {
  try {
    const supabase = await createClient();

    // Fetch products in parallel — banner data is streamed separately via Suspense
    const [
      { data: featuredProducts, error: featuredError },
      { data: arrivalProducts, error: arrivalError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (featuredError) {
      await logger.error("Failed to fetch featured products for homepage", {
        source: LOG_SOURCE,
        context: { error: featuredError.message },
      });
    } else if (!featuredProducts?.length) {
      await logger.warn("No featured products found for homepage", {
        source: LOG_SOURCE,
      });
    }

    if (arrivalError) {
      await logger.error("Failed to fetch new-arrival products for homepage", {
        source: LOG_SOURCE,
        context: { error: arrivalError.message },
      });
    } else if (!arrivalProducts?.length) {
      await logger.warn("No new-arrival products found for homepage", {
        source: LOG_SOURCE,
      });
    }

    await logger.info("Homepage viewed", {
      source: LOG_SOURCE,
      context: {
        featuredCount: featuredProducts?.length || 0,
        arrivalCount: arrivalProducts?.length || 0,
      },
    });

    return (
      <main className="min-h-screen">
        {/* <HeroSection /> */}

        {/* Streams in independently — page shell renders immediately */}
        <Suspense fallback={<SectionSkeleton height="220px" />}>
          <BannerPlacement placementName="home-page-below-hero-section" />
        </Suspense>

        <HomePageSections
          featuredProducts={featuredProducts || []}
          arrivalProducts={arrivalProducts || []}
        />

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
