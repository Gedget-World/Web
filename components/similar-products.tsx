"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface SimilarProductsProps {
  productId: string;
  collectionId?: string;
}

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  discount_percentage: number | null;
  is_out_of_stock: boolean;
};

export function SimilarProducts({
  productId,
  collectionId,
}: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .neq("id", productId)
        .limit(10);

      if (collectionId) {
        query = query.eq("collection_id", collectionId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchSimilarProducts();
  }, [productId, collectionId]);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("similar-products-scroll");
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  if (loading) {
    return (
      <section className="mt-12 pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          You May Also Like
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        id="similar-products-scroll"
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[180px] max-w-[200px] snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
