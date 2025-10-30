import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductReviews } from "@/components/product-reviews"

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, collections(name, slug)")
    .eq("slug", slug)
    .single()

  if (!product) {
    notFound()
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })

  const reviewCount = reviews?.length || 0
  const averageRating = reviews?.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <Button variant="ghost" asChild className="mb-8">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg?height=800&width=600"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            {product.collections && (
              <Link
                href={`/collections/${product.collections.slug}`}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {product.collections.name}
              </Link>
            )}
            <h1 className="text-4xl font-bold text-slate-900 mt-2 mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-slate-900">${product.price}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Availability:</span>
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
            }}
            disabled={product.stock <= 0}
          />
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        reviews={reviews || []}
        averageRating={averageRating}
        reviewCount={reviewCount}
        userEmail={user?.email || null}
      />
    </main>
  )
}
