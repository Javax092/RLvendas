import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { normalizeCartItems } from "../api/helpers";
import type { CartItem, Product } from "../types";
import { calculateCartCount, calculateCartTotal } from "../utils/cart";

const STORAGE_KEY = "don-burguer-saas-cart";

type CartContextValue = {
  items: CartItem[];
  setRestaurantScope: (restaurantSlug: string) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

export const CartContext = createContext<CartContextValue>({
  items: [],
  setRestaurantScope: () => undefined,
  addItem: () => undefined,
  removeItem: () => undefined,
  decrementItem: () => undefined,
  updateItemNotes: () => undefined,
  clearCart: () => undefined,
  total: 0,
  count: 0
});

function loadPersistedCart() {
  if (typeof window === "undefined") {
    return {} as Record<string, CartItem[]>;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, CartItem[]>;

    return Object.fromEntries(
      Object.entries(parsed).map(([restaurantSlug, items]) => [
        restaurantSlug,
        normalizeCartItems(items)
      ])
    );
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [restaurantScope, setRestaurantScope] = useState("default");
  const [cartByRestaurant, setCartByRestaurant] = useState<Record<string, CartItem[]>>(() => loadPersistedCart());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartByRestaurant));
  }, [cartByRestaurant]);

  const items = cartByRestaurant[restaurantScope] ?? [];

  const updateScopedItems = useCallback((updater: (current: CartItem[]) => CartItem[]) => {
    setCartByRestaurant((current) => ({
      ...current,
      [restaurantScope]: updater(current[restaurantScope] ?? [])
    }));
  }, [restaurantScope]);

  const addItem = useCallback((product: Product) => {
    updateScopedItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }, [updateScopedItems]);

  const decrementItem = useCallback((productId: string) => {
    updateScopedItems((current) =>
      current
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }, [updateScopedItems]);

  const removeItem = useCallback((productId: string) => {
    updateScopedItems((current) => current.filter((item) => item.product.id !== productId));
  }, [updateScopedItems]);

  const updateItemNotes = useCallback((productId: string, notes: string) => {
    updateScopedItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              notes
            }
          : item
      )
    );
  }, [updateScopedItems]);

  const clearCart = useCallback(() => {
    setCartByRestaurant((current) => ({
      ...current,
      [restaurantScope]: []
    }));
  }, [restaurantScope]);

  const total = useMemo(() => calculateCartTotal(items), [items]);
  const count = useMemo(() => calculateCartCount(items), [items]);

  const value = useMemo(
    () => ({
      items,
      setRestaurantScope,
      addItem,
      removeItem,
      decrementItem,
      updateItemNotes,
      clearCart,
      total,
      count
    }),
    [items, addItem, removeItem, decrementItem, updateItemNotes, clearCart, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
