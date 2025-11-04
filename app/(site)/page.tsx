import { createClient } from "@/lib/supabase/server"
import { HeroSection } from "@/components/hero-section"
import { FeaturedProducts } from "@/components/featured-products"
import { CollectionsGrid } from "@/components/collections-grid"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: featuredProducts } = await supabase.from("products").select("*").eq("is_featured", true).limit(6)

  // Fetch collections
  const { data: collections } = await supabase.from("collections").select("*").limit(4)

  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturedProducts products={featuredProducts || []} />
      <CollectionsGrid collections={collections || []} />
    </main>
  )
}
