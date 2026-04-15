import type { Promotion, Product } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toDecimalString, toSafeNumber } from "../utils/money.js";

type PromotionLike = Pick<
  Promotion,
  | "id"
  | "title"
  | "type"
  | "value"
  | "active"
  | "description"
  | "productId"
  | "categoryId"
  | "minimumOrderAmount"
  | "highlightLabel"
  | "startsAt"
  | "endsAt"
  | "deletedAt"
>;

type ProductLike = Pick<
  Product,
  | "id"
  | "categoryId"
  | "name"
  | "description"
  | "imageUrl"
  | "price"
  | "costPrice"
  | "compareAtPrice"
  | "stockQuantity"
  | "isActive"
  | "isFeatured"
  | "productType"
  | "tags"
> & {
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sortOrder: number;
    isActive: boolean;
  } | null;
};

function isPromotionCurrentlyAvailable(promotion: PromotionLike, now = new Date()) {
  if (!promotion.active || promotion.deletedAt) {
    return false;
  }

  if (promotion.startsAt && promotion.startsAt > now) {
    return false;
  }

  if (promotion.endsAt && promotion.endsAt < now) {
    return false;
  }

  return true;
}

function matchesPromotionTarget(product: ProductLike, promotion: PromotionLike) {
  if (promotion.productId) {
    return promotion.productId === product.id;
  }

  if (promotion.categoryId) {
    return promotion.categoryId === product.categoryId;
  }

  return true;
}

function computePromotionalPrice(price: number, promotion: PromotionLike) {
  const value = toSafeNumber(promotion.value);
  const normalizedType = promotion.type.trim().toLowerCase();

  if (normalizedType === "percentage" || normalizedType === "percentual" || normalizedType === "discount") {
    return Math.max(0, price - price * (value / 100));
  }

  if (normalizedType === "fixed" || normalizedType === "fixed_amount" || normalizedType === "valor_fixo") {
    return Math.max(0, price - value);
  }

  if (
    normalizedType === "fixed_price" ||
    normalizedType === "preco_promocional" ||
    normalizedType === "price_override"
  ) {
    return Math.max(0, value);
  }

  return price;
}

function chooseBestPromotion(
  product: ProductLike,
  promotions: PromotionLike[],
  context: { subtotal?: number } = {},
) {
  const basePrice = toSafeNumber(product.price);
  const subtotal = context.subtotal ?? 0;

  let selected: PromotionLike | null = null;
  let selectedPrice = basePrice;

  for (const promotion of promotions) {
    if (!isPromotionCurrentlyAvailable(promotion) || !matchesPromotionTarget(product, promotion)) {
      continue;
    }

    const minimumOrderAmount = toSafeNumber(promotion.minimumOrderAmount);
    if (minimumOrderAmount > 0 && subtotal > 0 && subtotal < minimumOrderAmount) {
      continue;
    }

    const candidatePrice = computePromotionalPrice(basePrice, promotion);

    if (!selected || candidatePrice < selectedPrice) {
      selected = promotion;
      selectedPrice = candidatePrice;
    }
  }

  return {
    promotion: selected,
    promotionalPrice: selected && selectedPrice < basePrice ? Number(selectedPrice.toFixed(2)) : null,
  };
}

export async function getRestaurantPromotions(restaurantId: string) {
  return prisma.promotion.findMany({
    where: {
      restaurantId,
      deletedAt: null,
    },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function enrichProductsWithPromotions<T extends ProductLike>(
  restaurantId: string,
  products: T[],
  context: { subtotal?: number } = {},
) {
  if (products.length === 0) {
    return [];
  }

  const promotions = await getRestaurantPromotions(restaurantId);
  const categoryIds = [...new Set(products.map((product) => product.categoryId).filter(Boolean))];
  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  return products.map((product) => {
    const { promotion, promotionalPrice } = chooseBestPromotion(product, promotions, context);

    return {
      ...product,
      promotionalPrice,
      promotion: promotion
        ? {
            ...promotion,
            productName: product.name,
            categoryName: categoryMap.get(product.categoryId) ?? product.category?.name ?? null,
            originalPrice: toSafeNumber(product.price),
            promotionalPrice,
          }
        : null,
    };
  });
}

export function resolveOrderItemPrice(
  product: ProductLike,
  promotions: PromotionLike[],
  context: { subtotal?: number } = {},
) {
  const { promotion, promotionalPrice } = chooseBestPromotion(product, promotions, context);
  const basePrice = toSafeNumber(product.price);

  return {
    promotion,
    unitPrice: promotionalPrice ?? basePrice,
    basePrice,
  };
}

export function promotionCreateData(input: {
  restaurantId: string;
  title: string;
  type: string;
  value: number;
  active?: boolean;
  description?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  minimumOrderAmount?: number | null;
  highlightLabel?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  return {
    restaurantId: input.restaurantId,
    title: input.title,
    type: input.type,
    value: toDecimalString(input.value),
    active: input.active ?? true,
    description: input.description ?? null,
    productId: input.productId ?? null,
    categoryId: input.categoryId ?? null,
    minimumOrderAmount:
      input.minimumOrderAmount == null ? null : toDecimalString(input.minimumOrderAmount),
    highlightLabel: input.highlightLabel ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
  };
}
