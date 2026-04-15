import type { CartItem } from "../types";
import { normalizeCurrencyValue, normalizeNumber } from "./currency";

export function calculateCartTotal(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + normalizeCurrencyValue(item.product.price) * normalizeNumber(item.quantity, 0),
    0,
  );
}

export function calculateCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + normalizeNumber(item.quantity, 0), 0);
}
