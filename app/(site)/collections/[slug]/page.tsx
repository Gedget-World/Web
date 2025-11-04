import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CollectionDetailClient } from "@/components/collection-detail-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase.from("collections").select("*").eq("slug", slug).single()

  if (!collection) {
    notFound()
  }

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      reviews(rating)
    `)
    .eq("collection_id", collection.id)

  const productsWithRatings = products?.map((product) => {
    const reviews = product.reviews as { rating: number }[]
    const reviewCount = reviews?.length || 0
    const averageRating = reviewCount > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0

    return {
      ...product,
      average_rating: averageRating,
      review_count: reviewCount,
    }
  })

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <Button variant="ghost" asChild className="mb-8">
        <Link href="/collections">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Link>
      </Button>

      <CollectionDetailClient collection={collection} products={productsWithRatings || []} />
    </main>
  )
}
