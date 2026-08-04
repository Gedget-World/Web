// No "use client" — this shell is a Server Component. The heavy below-the-fold
// pieces are code-split via next/dynamic so their JS isn't parsed/executed
// until they're actually needed, which cuts down initial-load JS (TBT).
import dynamic from "next/dynamic";
import { LazySection, SectionSkeleton } from "@/components/lazy-section";
import ProductsList from "@/components/Products-list";

const FAQSections = dynamic(() => import("@/components/faq-sections"));
const RecentlyViewedProducts = dynamic(() =>
  import("@/components/recently-viewed-products").then(
    (mod) => mod.RecentlyViewedProducts,
  ),
);
const TestimonialsSection = dynamic(
  () => import("@/components/testimonials-section"),
);

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
      {/* Featured Products */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={featuredProducts}
          heading="Featured Products"
          exploreLink="/products?featured=true"
        />
      </LazySection>

      {/* New Arrivals */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={arrivalProducts}
          heading="New Arrivals"
          exploreLink="/products?newArrival=true"
        />
      </LazySection>

      {/* Recently Viewed */}
      <LazySection fallback={<SectionSkeleton height="300px" />}>
        <RecentlyViewedProducts />
      </LazySection>

      {/* Testimonials */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <TestimonialsSection />
      </LazySection>

      {/* Featured Section */}
      {/* <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FeaturedSection />
      </LazySection> */}

      {/* Newsletter */}
      {/* <LazySection fallback={<SectionSkeleton height="350px" />}>
        <NewsletterSection />
      </LazySection> */}

      {/* FAQ */}
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FAQSections />
      </LazySection>
    </>
  );
}
