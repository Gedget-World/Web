import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/hero-section";
import { HomePageSections } from "@/components/home-page-sections";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(5);

  // Fetch arrival products
  const { data: arrivalProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <HomePageSections
        featuredProducts={featuredProducts || []}
        arrivalProducts={arrivalProducts || []}
      />
    </main>
  );
}
