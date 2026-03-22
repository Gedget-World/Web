"use client";

import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "./product-card";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function RecentlyViewedProducts() {
  const products = useRecentlyViewed((state) => state.products);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for zustand hydration from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't render anything if not hydrated or no products
  if (!isHydrated || products.length === 0) {
    return null;
  }

  // Transform products to match ProductCard expected format
  const productCards = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: null,
    price: product.price,
    image_url: product.image_url,
    stock: product.is_out_of_stock ? 0 : 1,
    discount_percentage: product.discount_percentage,
    is_out_of_stock: product.is_out_of_stock,
  }));

  return (
    <section className="py-5 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-2xl text-slate-900 mb-2">
          Recently Viewed
        </h4>
        <Button variant="outline" className="cursor-pointer" size="sm" asChild>
          <a href="/products">
            Explore <ArrowRight />
          </a>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
        {productCards.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
