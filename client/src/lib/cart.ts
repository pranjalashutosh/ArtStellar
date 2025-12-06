import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in USD
  category?: string;
  image?: string;
  dimensions?: string | null;
  medium?: string | null;
  type?: "physical" | "digital";
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isOpen: boolean;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          const isPhysical = product.type === "physical";
          
          if (existing) {
            // For physical originals (1-of-1), max quantity is 1
            if (isPhysical && existing.quantity >= 1) {
              return { isOpen: true }; // Don't increment, just open cart
            }
            
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }], isOpen: true };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const isPhysical = item.type === "physical";
              // Cap physical originals at quantity 1
              const maxQty = isPhysical ? 1 : quantity;
              return { ...item, quantity: Math.min(quantity, maxQty) };
            }
            return item;
          }),
        })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "cart-storage",
    }
  )
);
