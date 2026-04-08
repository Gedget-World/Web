"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  stock?: number;
};

type Coupon = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  min_purchase_amount: number;
};

type CartStore = {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  addItem: (item: Omit<CartItem, "quantity"> & { stock?: number }) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number, stock?: number) => boolean;
  updateItemStock: (id: string, stock: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      addItem: (item) => {
        const state = get();
        const existingItem = state.items.find((i) => i.id === item.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const stock = item.stock ?? Infinity;

        // Check if adding one more would exceed stock
        if (currentQuantity + 1 > stock) {
          return false;
        }

        set((state) => {
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + 1, stock: item.stock }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
        return true;
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity, stock) => {
        if (stock !== undefined && quantity > stock) {
          return false;
        }
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
        return true;
      },
      updateItemStock: (id, stock) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              // If current quantity exceeds new stock, reduce it
              const newQuantity = Math.min(i.quantity, stock);
              return {
                ...i,
                stock,
                quantity: newQuantity > 0 ? newQuantity : 1,
              };
            }
            return i;
          }),
        }));
      },
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      clearCart: () => set({ items: [], appliedCoupon: null }),
      getItemQuantity: (id) => {
        const item = get().items.find((i) => i.id === id);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);
