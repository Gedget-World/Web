import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  products_count?: { count: number }[];
};

export function CollectionsGrid({
  collections,
}: {
  collections: Collection[];
}) {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto bg-slate-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Shop by Collection
        </h2>
        <p className="text-lg text-slate-600">
          Curated styles for every occasion
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`}>
            <Card className="group overflow-hidden hover:shadow-xl transition-shadow p-0">
              <div className="relative aspect-16/12 overflow-hidden">
                <Image
                  src={
                    collection.image_url ||
                    "/placeholder.svg?height=400&width=600"
                  }
                  alt={collection.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {collection.name}
                    </h3>
                    <p className="text-slate-200 text-xs">
                      {collection.description}
                    </p>
                    <p className="mt-2 text-sm">
                      {collection.products_count?.[0]?.count ?? 0} items
                    </p>
                  </div>
                  <div>
                    <Button className="backdrop-blur-md bg-white/20 text-white border border-white/30 hover:bg-white/30">
                      Browse <ArrowRight />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
