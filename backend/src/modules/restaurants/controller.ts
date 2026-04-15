import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { enrichProductsWithPromotions } from "../../services/promotion-engine.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { serializeRestaurant, serializeRestaurantSettings } from "../../utils/serializers.js";
import { updateRestaurantSchema, updateSettingsSchema } from "./schema.js";

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/burguer/g, "burger").replace(/[^a-z0-9]/g, "");
}

async function findRestaurantByPublicSlug(slug: string) {
  const exactMatch = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedSlug = normalizeSlug(slug);
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      slug: true
    }
  });

  return restaurants.find((restaurant) => normalizeSlug(restaurant.slug) === normalizedSlug) ?? null;
}

async function getPublicRestaurantPayloadById(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      whatsappNumber: true,
      plan: true,
      isAiUpsellOn: true,
      settings: {
        select: {
          heroTitle: true,
          heroSubtitle: true,
          seoTitle: true,
          seoDescription: true,
          bannerUrl: true,
          deliveryFee: true,
          minimumOrderAmount: true,
          estimatedTimeMin: true,
          estimatedTimeMax: true
        }
      },
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          sortOrder: true,
          isActive: true,
          products: {
            where: { isActive: true },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
            select: {
              id: true,
              categoryId: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
              costPrice: true,
              compareAtPrice: true,
              stockQuantity: true,
              isActive: true,
              isFeatured: true,
              productType: true,
              tags: true
            }
          }
        }
      }
    }
  });

  if (!restaurant) {
    return null;
  }

  const promotedCategories = await Promise.all(
    restaurant.categories.map(async (category) => ({
      ...category,
      products: await enrichProductsWithPromotions(restaurantId, category.products),
    })),
  );

  return {
    ...restaurant,
    categories: promotedCategories,
  };
}

export const getMyRestaurant = asyncHandler(async (request: Request, response: Response) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.user!.restaurantId },
    include: {
      settings: true
    }
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  return response.json({
    data: {
      ...restaurant,
      settings: serializeRestaurantSettings(restaurant.settings),
    },
  });
});

export const updateMyRestaurant = asyncHandler(async (request: Request, response: Response) => {
  const data = updateRestaurantSchema.parse(request.body);

  if (data.slug) {
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        slug: data.slug,
        id: {
          not: request.user!.restaurantId
        }
      }
    });

    if (existingRestaurant) {
      throw new ApiError(409, "Slug do restaurante ja esta em uso.");
    }
  }

  const restaurant = await prisma.restaurant.update({
    where: { id: request.user!.restaurantId },
    data,
    include: {
      settings: true,
    },
  });

  return response.json({
    data: {
      ...restaurant,
      settings: serializeRestaurantSettings(restaurant.settings),
    },
  });
});

export const getMySettings = asyncHandler(async (request: Request, response: Response) => {
  const settings = await prisma.restaurantSetting.findUnique({
    where: {
      restaurantId: request.user!.restaurantId
    }
  });

  if (!settings) {
    throw new ApiError(404, "Configuracoes do restaurante nao encontradas.");
  }

  return response.json({ data: serializeRestaurantSettings(settings) });
});

export const updateMySettings = asyncHandler(async (request: Request, response: Response) => {
  const data = updateSettingsSchema.parse(request.body);

  const settings = await prisma.restaurantSetting.upsert({
    where: {
      restaurantId: request.user!.restaurantId
    },
    update: data,
    create: {
      restaurantId: request.user!.restaurantId,
      ...data
    }
  });

  return response.json({ data: serializeRestaurantSettings(settings) });
});

export const getPublicRestaurant = asyncHandler(async (request: Request, response: Response) => {
  const slug = String(request.params.slug);
  const restaurantRef = await findRestaurantByPublicSlug(slug);

  if (!restaurantRef) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const restaurant = await getPublicRestaurantPayloadById(restaurantRef.id);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  return response.json({ data: serializeRestaurant(restaurant) });
});

export const getPublicMenu = asyncHandler(async (request: Request, response: Response) => {
  const slug = String(request.params.slug);
  const restaurantRef = await findRestaurantByPublicSlug(slug);

  if (!restaurantRef) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const restaurant = await getPublicRestaurantPayloadById(restaurantRef.id);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  return response.json({
    data: serializeRestaurant(restaurant)
  });
});
