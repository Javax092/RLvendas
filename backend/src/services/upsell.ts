type CartItem = {
  productId: string;
  name: string;
  categoryName: string;
  price: number;
  quantity: number;
};

type ProductOption = {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  tags: string[];
};

export function suggestUpsell(items: CartItem[], products: ProductOption[]) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const names = items.map((item) => item.name.toLowerCase());

  if (names.some((name) => name.includes("combo"))) {
    return products.find((product) => product.categoryName === "Bebidas" && product.price <= 10) || null;
  }

  if (items.some((item) => item.categoryName === "Hamburgueres")) {
    return products.find((product) => product.tags.includes("upsell")) || null;
  }

  if (total < 35) {
    return products.find((product) => product.price <= 12 && product.categoryName !== "Hamburgueres") || null;
  }

  return null;
}

