import { Request, Response } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { extractTextFromBuffer, parseMenuInput } from "../services/menu-import.js";

const importTextSchema = z.object({
  rawText: z.string().min(3)
});

async function ensureCategory(restaurantId: string, name: string) {
  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.category.findUnique({
    where: {
      restaurantId_slug: {
        restaurantId,
        slug
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.category.create({
    data: {
      restaurantId,
      name,
      slug,
      sortOrder: 99,
      isActive: true
    }
  });
}

export async function previewMenuImport(request: Request, response: Response) {
  const body = importTextSchema.parse(request.body);
  const items = parseMenuInput(body.rawText);

  return response.json({
    items,
    count: items.length
  });
}

export async function importMenuFromText(request: Request, response: Response) {
  const body = importTextSchema.parse(request.body);
  const items = parseMenuInput(body.rawText);
  const restaurantId = request.user!.restaurantId;

  const created = [];

  for (const item of items) {
    const category = await ensureCategory(restaurantId, item.categoryName);
    const slug = slugify(item.name, { lower: true, strict: true });

    const product = await prisma.product.upsert({
      where: {
        restaurantId_slug: {
          restaurantId,
          slug
        }
      },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        tags: item.tags,
        productType: item.productType,
        categoryId: category.id,
        isActive: true
      },
      create: {
        restaurantId,
        categoryId: category.id,
        name: item.name,
        slug,
        description: item.description,
        price: item.price,
        tags: item.tags,
        productType: item.productType,
        isActive: true
      }
    });

    created.push(product);
  }

  return response.status(201).json({
    createdCount: created.length,
    products: created
  });
}

export async function importMenuFromFile(request: Request, response: Response) {
  const file = request.file;

  if (!file) {
    return response.status(400).json({ message: "Arquivo nao enviado" });
  }

  const rawText = extractTextFromBuffer(file.buffer);
  const items = parseMenuInput(rawText);

  return response.json({
    fileName: file.originalname,
    rawText,
    items,
    count: items.length
  });
}

