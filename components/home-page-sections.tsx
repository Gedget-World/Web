"use client";

import { LazySection, SectionSkeleton } from "@/components/lazy-section";
import ProductsList from "@/components/Products-list";
import FeaturedSection from "@/components/featured-section";
import FAQSections from "@/components/faq-sections";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  discount_percentage: number | null;
  is_featured: boolean;
  stock: number;
  average_rating?: number;
  review_count?: number;
  is_out_of_stock: boolean;
}

interface HomePageSectionsProps {
  featuredProducts: Product[];
  arrivalProducts: Product[];
}

export function HomePageSections({
  featuredProducts,
  arrivalProducts,
}: HomePageSectionsProps) {
  return (
    <>
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={featuredProducts}
          heading="Featured Products"
          exploreLink="#"
        />
      </LazySection>

      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={arrivalProducts}
          heading="New Arrivals"
          exploreLink="#"
        />
      </LazySection>

      <LazySection fallback={<SectionSkeleton height="300px" />}>
        <RecentlyViewedProducts />
      </LazySection>

      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FeaturedSection />
      </LazySection>

      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FAQSections />
      </LazySection>
    </>
  );
}
