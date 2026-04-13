import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { slugify } from "../../utils/slug.js";
import { createProductSchema, updateProductSchema } from "./schema.js";

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
      imageUrl: body.imageUrl,
      price: body.price.toFixed(2),
      costPrice: body.costPrice?.toFixed(2) ?? null,
      compareAtPrice: body.compareAtPrice?.toFixed(2) ?? null,
      stockQuantity: body.stockQuantity ?? 40,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      productType: body.productType ?? "SINGLE",
      tags: body.tags ?? []
    }
  });

  return response.status(201).json({ data: product });
});

export const listProducts = asyncHandler(async (request: Request, response: Response) => {
  const categoryId = typeof request.query.categoryId === "string" ? request.query.categoryId : undefined;
  const products = await prisma.product.findMany({
    where: {
      restaurantId: request.user!.restaurantId,
      categoryId
    },
    include: {
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return response.json({ data: products });
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

  return response.json({ data: product });
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
      imageUrl: body.imageUrl,
      price: body.price?.toFixed(2),
      costPrice: body.costPrice === null ? null : body.costPrice?.toFixed(2),
      compareAtPrice: body.compareAtPrice === null ? null : body.compareAtPrice?.toFixed(2),
      stockQuantity: body.stockQuantity,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      productType: body.productType,
      tags: body.tags
    }
  });

  return response.json({ data: product });
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
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug
    }
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const products = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      categoryId,
      isActive: true
    },
    include: {
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return response.json({ data: products });
});
