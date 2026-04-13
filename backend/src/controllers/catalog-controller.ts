import { Request, Response } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true)
});

const productSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(2),
  description: z.string().min(5),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  productType: z.enum(["SINGLE", "COMBO", "ADDON"]).default("SINGLE"),
  tags: z.array(z.string()).default([])
});

export async function getPublicMenu(request: Request, response: Response) {
  const { slug } = z.object({ slug: z.string() }).parse(request.params);

  const restaurant = await prisma.restaurant.findUnique({
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

  if (!restaurant) {
    return response.status(404).json({ message: "Restaurante nao encontrado" });
  }

  return response.json(restaurant);
}

export async function listCategories(request: Request, response: Response) {
  const categories = await prisma.category.findMany({
    where: { restaurantId: request.user?.restaurantId },
    orderBy: { sortOrder: "asc" }
  });

  return response.json(categories);
}

export async function createCategory(request: Request, response: Response) {
  const body = categorySchema.parse(request.body);
  const slug = slugify(body.name, { lower: true, strict: true });

  const category = await prisma.category.create({
    data: {
      ...body,
      slug,
      restaurantId: request.user!.restaurantId
    }
  });

  return response.status(201).json(category);
}

export async function updateCategory(request: Request, response: Response) {
  const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
  const body = categorySchema.partial().parse(request.body);
  const current = await prisma.category.findUnique({ where: { id } });

  if (!current || current.restaurantId !== request.user!.restaurantId) {
    return response.status(404).json({ message: "Categoria nao encontrada" });
  }

  const data = body.name
    ? { ...body, slug: slugify(body.name, { lower: true, strict: true }) }
    : body;

  const category = await prisma.category.update({
    where: { id },
    data
  });

  return response.json(category);
}

export async function listProducts(request: Request, response: Response) {
  const products = await prisma.product.findMany({
    where: { restaurantId: request.user?.restaurantId },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  return response.json(products);
}

export async function createProduct(request: Request, response: Response) {
  const body = productSchema.parse(request.body);
  const slug = slugify(body.name, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      ...body,
      imageUrl: body.imageUrl || null,
      slug,
      restaurantId: request.user!.restaurantId
    },
    include: { category: true }
  });

  return response.status(201).json(product);
}

export async function updateProduct(request: Request, response: Response) {
  const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
  const body = productSchema.partial().parse(request.body);
  const current = await prisma.product.findUnique({ where: { id } });

  if (!current || current.restaurantId !== request.user!.restaurantId) {
    return response.status(404).json({ message: "Produto nao encontrado" });
  }

  const data = body.name
    ? { ...body, slug: slugify(body.name, { lower: true, strict: true }) }
    : body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      imageUrl: body.imageUrl === "" ? null : body.imageUrl
    },
    include: { category: true }
  });

  return response.json(product);
}
