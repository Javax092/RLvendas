import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { slugify } from "../../utils/slug.js";

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/burguer/g, "burger").replace(/[^a-z0-9]/g, "");
}

async function findRestaurantIdByPublicSlug(slug: string) {
  const exactMatch = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (exactMatch) {
    return exactMatch.id;
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, slug: true },
  });

  return restaurants.find((restaurant) => normalizeSlug(restaurant.slug) === normalizeSlug(slug))?.id ?? null;
}
import { createCategorySchema, updateCategorySchema } from "./schema.js";

export const createCategory = asyncHandler(async (request: Request, response: Response) => {
  const body = createCategorySchema.parse(request.body);
  const slug = body.slug ?? slugify(body.name);
  const existing = await prisma.category.findFirst({
    where: {
      restaurantId: request.user!.restaurantId,
      OR: [
        { slug },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (existing) {
    throw new ApiError(409, "Ja existe uma categoria com esse nome neste restaurante.");
  }

  const sortOrder =
    body.sortOrder ??
    ((await prisma.category.aggregate({
      where: { restaurantId: request.user!.restaurantId },
      _max: { sortOrder: true },
    }))._max.sortOrder ?? -1) +
      1;

  const category = await prisma.category.create({
    data: {
      restaurantId: request.user!.restaurantId,
      name: body.name,
      slug,
      description: body.description,
      sortOrder,
      isActive: body.isActive ?? true
    }
  });

  return response.status(201).json({ data: category });
});

export const listCategories = asyncHandler(async (request: Request, response: Response) => {
  const categories = await prisma.category.findMany({
    where: {
      restaurantId: request.user!.restaurantId
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return response.json({ data: categories });
});

export const updateCategory = asyncHandler(async (request: Request, response: Response) => {
  const categoryId = String(request.params.id);
  const current = await prisma.category.findFirst({
    where: {
      id: categoryId,
      restaurantId: request.user!.restaurantId
    }
  });

  if (!current) {
    throw new ApiError(404, "Categoria nao encontrada.");
  }

  const body = updateCategorySchema.parse(request.body);
  const category = await prisma.category.update({
    where: { id: current.id },
    data: {
      ...body,
      slug: body.slug ?? (body.name ? slugify(body.name) : undefined)
    }
  });

  return response.json({ data: category });
});

export const deleteCategory = asyncHandler(async (request: Request, response: Response) => {
  const categoryId = String(request.params.id);
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      restaurantId: request.user!.restaurantId
    }
  });

  if (!category) {
    throw new ApiError(404, "Categoria nao encontrada.");
  }

  await prisma.category.delete({
    where: { id: category.id }
  });

  return response.json({
    message: "Categoria removida com sucesso."
  });
});

export const listPublicCategories = asyncHandler(async (request: Request, response: Response) => {
  const slug = String(request.params.slug);
  const restaurantId = await findRestaurantIdByPublicSlug(slug);

  if (!restaurantId) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const categories = await prisma.category.findMany({
    where: {
      restaurantId,
      isActive: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return response.json({ data: categories });
});
