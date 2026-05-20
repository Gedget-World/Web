"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

// Product data included in wishlist items (from DB join)
export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_out_of_stock: boolean;
  discount_percentage: number | null;
  is_new_arrival?: boolean;
  is_featured?: boolean;
};

// Full wishlist item from API
export type WishlistItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
};

// Local storage item (just product ID for guest users)
type LocalWishlistItem = {
  productId: string;
  addedAt: number;
};

interface WishlistStore {
  // Items stored locally (for both guest and authenticated users)
  items: LocalWishlistItem[];
  // Full items with product details (fetched from server)
  serverItems: WishlistItem[];
  // State flags
  isHydrated: boolean;
  isLoading: boolean;
  lastSynced: number | null;

  // Actions
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setServerItems: (items: WishlistItem[]) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (state: boolean) => void;
  setLastSynced: (timestamp: number) => void;
  getProductIds: () => string[];
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      serverItems: [],
      isHydrated: false,
      isLoading: false,
      lastSynced: null,

      addItem: (productId: string) => {
        const { items } = get();
        if (items.some((item) => item.productId === productId)) return;

        set({
          items: [...items, { productId, addedAt: Date.now() }],
        });
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((item) => item.productId !== productId),
          serverItems: get().serverItems.filter(
            (item) => item.productId !== productId,
          ),
        });
      },

      toggleItem: (productId: string) => {
        const { isInWishlist, addItem, removeItem } = get();
        if (isInWishlist(productId)) {
          removeItem(productId);
        } else {
          addItem(productId);
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some((item) => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [], serverItems: [], lastSynced: null });
      },

      setServerItems: (items: WishlistItem[]) => {
        // Also update local items to match server
        const localItems = items.map((item) => ({
          productId: item.productId,
          addedAt: new Date(item.createdAt).getTime(),
        }));
        set({ serverItems: items, items: localItems });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setHydrated: (state: boolean) => set({ isHydrated: state }),

      setLastSynced: (timestamp: number) => set({ lastSynced: timestamp }),

      getProductIds: () => get().items.map((item) => item.productId),
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({
        items: state.items,
        lastSynced: state.lastSynced,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

// Hook for wishlist operations with server sync
export function useWishlist() {
  const store = useWishlistStore();
  const supabase = createClient();

  // Fetch wishlist from server
  const fetchWishlist = async () => {
    store.setLoading(true);
    try {
      const response = await fetch("/api/wishlist");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.items) {
          store.setServerItems(data.items);
          store.setLastSynced(Date.now());
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      store.setLoading(false);
    }
  };

  // Add item (with server sync for authenticated users)
  const addItem = async (productId: string) => {
    // Optimistically update local state
    store.addItem(productId);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert on failure
          store.removeItem(productId);
          console.error("Failed to add to wishlist on server");
        }
      } catch (error) {
        store.removeItem(productId);
        console.error("Error adding to wishlist:", error);
      }
    }
  };

  // Remove item (with server sync for authenticated users)
  const removeItem = async (productId: string) => {
    // Optimistically update local state
    store.removeItem(productId);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const response = await fetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Re-add on failure
          store.addItem(productId);
          console.error("Failed to remove from wishlist on server");
        }
      } catch (error) {
        store.addItem(productId);
        console.error("Error removing from wishlist:", error);
      }
    }
  };

  // Toggle item (convenience method)
  const toggleItem = async (productId: string) => {
    if (store.isInWishlist(productId)) {
      await removeItem(productId);
    } else {
      await addItem(productId);
    }
  };

  // Sync localStorage items to server (call after sign-in)
  const syncToServer = async () => {
    const productIds = store.getProductIds();
    if (productIds.length === 0) return;

    try {
      const response = await fetch("/api/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });

      if (response.ok) {
        // Fetch full wishlist from server after sync
        await fetchWishlist();
      }
    } catch (error) {
      console.error("Error syncing wishlist:", error);
    }
  };

  // Initialize: fetch from server if authenticated
  const initialize = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is logged in - sync local items to server, then fetch
      const localItems = store.getProductIds();
      if (localItems.length > 0 && !store.lastSynced) {
        await syncToServer();
      } else {
        await fetchWishlist();
      }
    }
  };

  return {
    // State
    items: store.items,
    serverItems: store.serverItems,
    isLoading: store.isLoading,
    isHydrated: store.isHydrated,
    count: store.items.length,

    // Actions
    addItem,
    removeItem,
    toggleItem,
    isInWishlist: store.isInWishlist,
    clearWishlist: store.clearWishlist,
    fetchWishlist,
    syncToServer,
    initialize,
  };
}
