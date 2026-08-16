"use client";

import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "./product-card";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function RecentlyViewedProducts() {
  const products = useRecentlyViewed((state) => state.products);
  const [isHydrated, setIsHydrated] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("recently-viewed-scroll");
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

  return (
    <section className="mt-1 max-w-7xl pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-2xl text-slate-900">
          Recently Viewed
        </h2>
        <div className="flex items-center gap-2">
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
        id="recently-viewed-scroll"
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {productCards.map((product) => (
          <div key={product.id} className="w-[180px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
