import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/hero-section";
import { CollectionsGrid } from "@/components/collections-grid";
import ProductsList from "@/components/Products-list";
import FeaturedSection from "@/components/featured-section";
import FAQSections from "@/components/faq-sections";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .limit(5);

  // Fetch arrival products
  const { data: arrivalProducts } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch collections
  const { data: collections } = await supabase
    .from("collections")
    .select("*")
    .limit(3);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <ProductsList
        products={featuredProducts || []}
        heading={"Featured Products"}
        exploreLink={"#"}
      />
      <CollectionsGrid
        collections={collections || []}
        heading={"Explore Collections"}
        exploreLink={"#"}
      />
      <ProductsList
        products={arrivalProducts || []}
        heading={"New Arrivals"}
        exploreLink={"#"}
      />
      <FeaturedSection />
      <FAQSections />
    </main>
  );
}
