import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"

type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

export function CollectionsGrid({ collections }: { collections: Collection[] }) {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto bg-slate-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Shop by Collection</h2>
        <p className="text-lg text-slate-600">Curated styles for every occasion</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`}>
            <Card className="group overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={collection.image_url || "/placeholder.svg?height=400&width=600"}
                  alt={collection.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                  <p className="text-slate-200">{collection.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
