"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

type ProductViewTrackerProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    discount_percentage: number | null;
    is_out_of_stock: boolean;
  };
};

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const addProduct = useRecentlyViewed((state) => state.addProduct);

  useEffect(() => {
    // Track product view
    addProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: product.image_url,
      discount_percentage: product.discount_percentage,
      is_out_of_stock: product.is_out_of_stock,
    });
  }, [product, addProduct]);

  return null;
}
