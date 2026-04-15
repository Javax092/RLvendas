import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { enrichProductsWithPromotions } from "../../services/promotion-engine.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { toDecimalString } from "../../utils/money.js";
import { serializeProduct } from "../../utils/serializers.js";
import { slugify } from "../../utils/slug.js";
import { createProductSchema, updateProductSchema } from "./schema.js";

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

async function ensureCategoryOwnership(categoryId: string, restaurantId: string) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      restaurantId
    }
  });

  if (!category) {
    throw new ApiError(404, "Categoria nao encontrada para este restaurante.");
  }
}

export const createProduct = asyncHandler(async (request: Request, response: Response) => {
  const body = createProductSchema.parse(request.body);
  await ensureCategoryOwnership(body.categoryId, request.user!.restaurantId);

  const product = await prisma.product.create({
    data: {
      restaurantId: request.user!.restaurantId,
      categoryId: body.categoryId,
      name: body.name,
      slug: body.slug ?? slugify(body.name),
      description: body.description,
      imageUrl: body.imageUrl ?? null,
      price: toDecimalString(body.price),
      costPrice: body.costPrice == null ? null : toDecimalString(body.costPrice),
      compareAtPrice: body.compareAtPrice == null ? null : toDecimalString(body.compareAtPrice),
      stockQuantity: body.stockQuantity ?? 40,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      productType: body.productType ?? "SINGLE",
      tags: body.tags ?? []
    }
  });

  return response.status(201).json({ data: serializeProduct(product) });
});

export const listProducts = asyncHandler(async (request: Request, response: Response) => {
  const restaurantId = request.user!.restaurantId;
  const categoryId = typeof request.query.categoryId === "string" ? request.query.categoryId : undefined;
  const products = await prisma.product.findMany({
    where: {
      restaurantId,
      categoryId
    },
    include: {
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  const productsWithPromotions = await enrichProductsWithPromotions(restaurantId, products);

  return response.json({ data: productsWithPromotions.map(serializeProduct) });
});

export const getProduct = asyncHandler(async (request: Request, response: Response) => {
  const productId = String(request.params.id);
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      restaurantId: request.user!.restaurantId
    },
    include: {
      category: true
    }
  });

  if (!product) {
    throw new ApiError(404, "Produto nao encontrado.");
  }

  return response.json({ data: serializeProduct(product) });
});

export const updateProduct = asyncHandler(async (request: Request, response: Response) => {
  const productId = String(request.params.id);
  const current = await prisma.product.findFirst({
    where: {
      id: productId,
      restaurantId: request.user!.restaurantId
    }
  });

  if (!current) {
    throw new ApiError(404, "Produto nao encontrado.");
  }

  const body = updateProductSchema.parse(request.body);

  if (body.categoryId) {
    await ensureCategoryOwnership(body.categoryId, request.user!.restaurantId);
  }

  const product = await prisma.product.update({
    where: { id: current.id },
    data: {
      categoryId: body.categoryId,
      name: body.name,
      slug: body.slug ?? (body.name ? slugify(body.name) : undefined),
      description: body.description,
      imageUrl: body.imageUrl === undefined ? undefined : body.imageUrl ?? null,
      price: body.price === undefined ? undefined : toDecimalString(body.price),
      costPrice:
        body.costPrice === undefined ? undefined : body.costPrice === null ? null : toDecimalString(body.costPrice),
      compareAtPrice:
        body.compareAtPrice === undefined
          ? undefined
          : body.compareAtPrice === null
            ? null
            : toDecimalString(body.compareAtPrice),
      stockQuantity: body.stockQuantity,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      productType: body.productType,
      tags: body.tags
    }
  });

  return response.json({ data: serializeProduct(product) });
});

export const deleteProduct = asyncHandler(async (request: Request, response: Response) => {
  const productId = String(request.params.id);
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      restaurantId: request.user!.restaurantId
    }
  });

  if (!product) {
    throw new ApiError(404, "Produto nao encontrado.");
  }

  await prisma.product.delete({
    where: { id: product.id }
  });

  return response.json({
    message: "Produto removido com sucesso."
  });
});

export const listPublicProducts = asyncHandler(async (request: Request, response: Response) => {
  const categoryId = typeof request.query.categoryId === "string" ? request.query.categoryId : undefined;
  const slug = String(request.params.slug);
  const restaurantId = await findRestaurantIdByPublicSlug(slug);

  if (!restaurantId) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const products = await prisma.product.findMany({
    where: {
      restaurantId,
      categoryId,
      isActive: true
    },
    include: {
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return response.json({ data: products.map(serializeProduct) });
});
