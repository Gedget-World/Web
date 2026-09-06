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

  useEffect(() => {
    // Read directly from window.location instead of useSearchParams() so this
    // stays a plain client effect (no Suspense boundary requirement) — only
    // needs to run once per mount, best-effort, never blocks the page.
    const linkCode = new URLSearchParams(window.location.search).get("ref");
    if (!linkCode) return;

    fetch("/api/referrals/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkCode, pageUrl: window.location.href }),
      keepalive: true,
    }).catch(() => {
      // Referral click tracking must never break the product page.
    });
  }, [product.id]);

  return null;
}
