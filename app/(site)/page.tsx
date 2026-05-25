import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/hero-section";
import { HomePageSections } from "@/components/home-page-sections";
import { BannerPlacement } from "@/components/banner-placement";
import { SectionSkeleton } from "@/components/lazy-section";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch products in parallel — banner data is streamed separately via Suspense
  const [{ data: featuredProducts }, { data: arrivalProducts }] =
    await Promise.all([
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
}
