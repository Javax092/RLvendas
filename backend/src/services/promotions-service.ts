import { getRestaurantProducts, numberValue } from "./restaurant-analytics.js";

export async function buildPromotions(restaurantId: string) {
  const products = await getRestaurantProducts(restaurantId);
  const featured = products.filter((product) => product.isFeatured).slice(0, 3);

  const promotions = featured.map((product, index) => ({
    id: `${product.id}-promo`,
    title: index === 0 ? `${product.name} em destaque` : `Upsell de ${product.name}`,
    type: index === 0 ? "discount" : index === 1 ? "combo" : "upsell",
    value: index === 0 ? 10 : index === 1 ? 15 : 12,
    active: true,
    description:
      index === 0
        ? `Desconto promocional para acelerar giro do item ${product.name}.`
        : `Oferta sugerida para elevar ticket medio com ${product.name}.`,
    productId: product.id,
    productName: product.name,
    originalPrice: numberValue(product.price)
  }));

  return {
    promotions:
      promotions.length > 0
        ? promotions
        : [
            {
              id: "promo-demo-combo",
              title: "Combo da casa",
              type: "combo",
              value: 12,
              active: true,
              description: "Oferta automatica para demonstracao comercial do SaaS.",
              productId: null,
              productName: "Combo RL Classic",
              originalPrice: 39
            }
          ]
  };
}
