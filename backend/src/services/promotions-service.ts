import { prisma } from "../lib/prisma.js";
import { getRestaurantPromotions } from "./promotion-engine.js";
import { serializePromotion } from "../utils/serializers.js";

export async function buildPromotions(restaurantId: string) {
  const promotions = await getRestaurantPromotions(restaurantId);
  const productIds = [...new Set(promotions.map((promotion) => promotion.productId).filter(Boolean))] as string[];
  const categoryIds = [...new Set(promotions.map((promotion) => promotion.categoryId).filter(Boolean))] as string[];
  const [products, categories] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true },
        })
      : [],
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return {
    promotions: promotions.map((promotion) =>
      serializePromotion({
        ...promotion,
        productName: promotion.productId ? productMap.get(promotion.productId)?.name ?? null : null,
        categoryName: promotion.categoryId ? categoryMap.get(promotion.categoryId)?.name ?? null : null,
        originalPrice: promotion.productId ? productMap.get(promotion.productId)?.price ?? null : null,
      }),
    ),
  };
}
