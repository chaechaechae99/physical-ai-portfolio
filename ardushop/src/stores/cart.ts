"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const clamp = (n: number, max: number) => Math.max(1, Math.min(n, Math.max(1, max), 99));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: clamp(i.quantity + quantity, item.stock) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: clamp(quantity, item.stock) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, quantity: clamp(quantity, i.stock) } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "ardushop-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
