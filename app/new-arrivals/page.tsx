import { createClient } from "@/lib/supabase/server"
import { NewArrivalsClient } from "@/components/new-arrivals-client"

export const metadata = {
  title: "New Arrivals | StyleHub",
  description: "Discover the latest fashion trends and new arrivals",
}

export default async function NewArrivalsPage() {
  const supabase = await createClient()

  // Fetch new arrival products (last 30 days or marked as new)
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      collections (
        id,
        name,
        slug
      )
    `,
    )
    .or("is_new_arrival.eq.true,created_at.gte." + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })

  // Fetch all collections for filters
  const { data: collections } = await supabase.from("collections").select("id, name, slug").order("name")

  return <NewArrivalsClient initialProducts={products || []} collections={collections || []} />
}
