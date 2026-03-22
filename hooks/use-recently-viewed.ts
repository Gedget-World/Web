"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentlyViewedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  discount_percentage: number | null;
  is_out_of_stock: boolean;
  viewedAt: number; // timestamp for ordering
};

type RecentlyViewedStore = {
  products: RecentlyViewedProduct[];
  addProduct: (product: Omit<RecentlyViewedProduct, "viewedAt">) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<RecentlyViewedProduct>) => void;
  clearAll: () => void;
  setProducts: (products: RecentlyViewedProduct[]) => void;
};

const MAX_RECENTLY_VIEWED = 10;

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) =>
        set((state) => {
          // Remove if already exists
          const filteredProducts = state.products.filter(
            (p) => p.id !== product.id,
          );

          // Add to the beginning with current timestamp
          const newProduct: RecentlyViewedProduct = {
            ...product,
            viewedAt: Date.now(),
          };

          // Keep only the latest MAX_RECENTLY_VIEWED products
          const updatedProducts = [newProduct, ...filteredProducts].slice(
            0,
            MAX_RECENTLY_VIEWED,
          );

          return { products: updatedProducts };
        }),
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      clearAll: () => set({ products: [] }),
      setProducts: (products) => set({ products }),
    }),
    {
      name: "recently-viewed-storage",
    },
  ),
);
