import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { updateRestaurantSchema, updateSettingsSchema } from "./schema.js";

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/burguer/g, "burger").replace(/[^a-z0-9]/g, "");
}

async function findRestaurantByPublicSlug(slug: string) {
  const exactMatch = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedSlug = normalizeSlug(slug);
  const restaurants = await prisma.restaurant.findMany({
    include: {
      settings: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  return restaurants.find((restaurant) => normalizeSlug(restaurant.slug) === normalizedSlug) ?? null;
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

  return response.json({ data: restaurant });
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
    data
  });

  return response.json({ data: restaurant });
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

  return response.json({ data: settings });
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

  return response.json({ data: settings });
});

export const getPublicRestaurant = asyncHandler(async (request: Request, response: Response) => {
  const slug = String(request.params.slug);
  const restaurant = await findRestaurantByPublicSlug(slug);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  return response.json({ data: restaurant });
});

export const getPublicMenu = asyncHandler(async (request: Request, response: Response) => {
  const slug = String(request.params.slug);
  const restaurant = await findRestaurantByPublicSlug(slug);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  return response.json({
    data: restaurant
  });
});
