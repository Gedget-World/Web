"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/use-cart";
import {
  useRecentlyViewed,
  RecentlyViewedProduct,
} from "@/hooks/use-recently-viewed";

export function FirstLoadHandler() {
  const removeItem = useCart((state) => state.removeItem);
  const updateItemStock = useCart((state) => state.updateItemStock);
  const items = useCart((state) => state.items);

  const recentlyViewedProducts = useRecentlyViewed((state) => state.products);
  const removeRecentlyViewedProduct = useRecentlyViewed(
    (state) => state.removeProduct,
  );
  const updateRecentlyViewedProduct = useRecentlyViewed(
    (state) => state.updateProduct,
  );
  const setRecentlyViewedProducts = useRecentlyViewed(
    (state) => state.setProducts,
  );

  const hasValidatedCart = useRef(false);
  const hasValidatedRecentlyViewed = useRef(false);

  // Validate cart products
  useEffect(() => {
    if (items.length > 0 && !hasValidatedCart.current) {
      hasValidatedCart.current = true;
      validateCartProducts(items, removeItem, updateItemStock);
    }
  }, [items, removeItem, updateItemStock]);

  // Validate recently viewed products
  useEffect(() => {
    if (
      recentlyViewedProducts.length > 0 &&
      !hasValidatedRecentlyViewed.current
    ) {
      hasValidatedRecentlyViewed.current = true;
      validateRecentlyViewedProducts(
        recentlyViewedProducts,
        removeRecentlyViewedProduct,
        updateRecentlyViewedProduct,
        setRecentlyViewedProducts,
      );
    }
  }, [
    recentlyViewedProducts,
    removeRecentlyViewedProduct,
    updateRecentlyViewedProduct,
    setRecentlyViewedProducts,
  ]);

  return null;
}

async function validateCartProducts(
  cartItems: { id: string; quantity: number }[],
  removeItem: (id: string) => void,
  updateItemStock: (id: string, stock: number) => void,
) {
  if (cartItems.length === 0) return;

  const supabase = createBrowserClient();
  const productIds = cartItems.map((item) => item.id);

  const { data: activeProducts, error } = await supabase
    .from("products")
    .select("id, stock, is_out_of_stock")
    .in("id", productIds)
    .eq("is_active", true);

  if (error) {
    console.error("Error validating cart products:", error);
    return;
  }

  const activeProductsMap = new Map(
    activeProducts?.map((p) => [p.id, p]) || [],
  );

  // Remove inactive products and validate stock for active ones
  cartItems.forEach((item) => {
    const product = activeProductsMap.get(item.id);

    if (!product) {
      // Product is inactive or doesn't exist
      removeItem(item.id);
      console.log(`Removed inactive product from cart: ${item.id}`);
    } else if (product.is_out_of_stock || product.stock <= 0) {
      // Product is out of stock
      removeItem(item.id);
      console.log(`Removed out of stock product from cart: ${item.id}`);
    } else if (item.quantity > product.stock) {
      // Cart quantity exceeds available stock - adjust it
      updateItemStock(item.id, product.stock);
      console.log(
        `Adjusted cart quantity for ${item.id}: ${item.quantity} -> ${product.stock}`,
      );
    } else {
      // Update stock value in cart to keep it in sync
      updateItemStock(item.id, product.stock);
    }
  });
}

async function validateRecentlyViewedProducts(
  recentlyViewedProducts: RecentlyViewedProduct[],
  removeProduct: (id: string) => void,
  updateProduct: (id: string, updates: Partial<RecentlyViewedProduct>) => void,
  setProducts: (products: RecentlyViewedProduct[]) => void,
) {
  if (recentlyViewedProducts.length === 0) return;

  const supabase = createBrowserClient();
  const productIds = recentlyViewedProducts.map((item) => item.id);

  const { data: activeProducts, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, image_url, discount_percentage, is_out_of_stock, stock",
    )
    .in("id", productIds)
    .eq("is_active", true);

  if (error) {
    console.error("Error validating recently viewed products:", error);
    return;
  }

  const activeProductsMap = new Map(
    activeProducts?.map((p) => [p.id, p]) || [],
  );

  // Build updated products list - removing inactive ones and updating active ones with latest data
  const updatedProducts: RecentlyViewedProduct[] = [];

  recentlyViewedProducts.forEach((item) => {
    const activeProduct = activeProductsMap.get(item.id);

    if (activeProduct) {
      // Update with latest values from database
      updatedProducts.push({
        ...item,
        name: activeProduct.name,
        slug: activeProduct.slug,
        price: activeProduct.price,
        image_url: activeProduct.image_url,
        discount_percentage: activeProduct.discount_percentage,
        is_out_of_stock:
          activeProduct.is_out_of_stock || activeProduct.stock <= 0,
      });
    } else {
      console.log(`Removed inactive product from recently viewed: ${item.id}`);
    }
  });

  // Update the entire list at once to preserve order and viewedAt timestamps
  setProducts(updatedProducts);
}
