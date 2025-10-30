import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  is_featured: boolean
  stock: number
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Featured Products</h2>
        <p className="text-lg text-slate-600">Handpicked favorites from our latest collection</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={`/products/${product.slug}`}>
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                <Image
                  src={product.image_url || "/placeholder.svg?height=500&width=400"}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{product.name}</h3>
                <p className="text-slate-600 text-sm line-clamp-2">{product.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">${product.price}</span>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button asChild size="lg" variant="outline">
          <Link href="/products">View All Products</Link>
        </Button>
      </div>
    </section>
  )
}
