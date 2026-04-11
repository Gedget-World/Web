"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Sparkles, TrendingUp } from "lucide-react";

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

interface RecommendedProductsProps {
  title?: string;
  limit?: number;
}

export function RecommendedProducts({
  title = "Recommended For You",
  limit = 8,
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch featured products first, then fill with popular/recent products
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchRecommendedProducts();
  }, [limit]);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
