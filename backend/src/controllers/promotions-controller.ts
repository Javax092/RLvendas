import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildPromotions } from "../services/promotions-service.js";
import { ok } from "../utils/api-response.js";
import { promotionCreateData } from "../services/promotion-engine.js";
import { z } from "zod";

const promotionShape = {
  title: z.string().trim().min(2),
  type: z.string().trim().min(2),
  value: z.coerce.number().min(0),
  active: z.boolean().optional(),
  description: z.string().trim().min(1).nullable().optional(),
  productId: z.string().trim().min(1).nullable().optional(),
  categoryId: z.string().trim().min(1).nullable().optional(),
  minimumOrderAmount: z.coerce.number().min(0).nullable().optional(),
  highlightLabel: z.string().trim().min(1).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
};

const promotionSchema = z
  .object(promotionShape)
  .superRefine((value, ctx) => {
    if (value.productId && value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Escolha produto ou categoria, nao ambos.",
      });
    }

    if (value.endsAt && value.startsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "A data final precisa ser maior que a inicial.",
      });
    }
  });

const promotionUpdateSchema = z
  .object({
    title: promotionShape.title.optional(),
    type: promotionShape.type.optional(),
    value: promotionShape.value.optional(),
    active: promotionShape.active,
    description: promotionShape.description,
    productId: promotionShape.productId,
    categoryId: promotionShape.categoryId,
    minimumOrderAmount: promotionShape.minimumOrderAmount,
    highlightLabel: promotionShape.highlightLabel,
    startsAt: promotionShape.startsAt,
    endsAt: promotionShape.endsAt,
  })
  .superRefine((value, ctx) => {
    if (value.productId && value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Escolha produto ou categoria, nao ambos.",
      });
    }

    if (value.endsAt && value.startsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "A data final precisa ser maior que a inicial.",
      });
    }
  });

export async function listPromotions(request: Request, response: Response) {
  const data = await buildPromotions(request.user!.restaurantId);
  return response.json(ok(data));
}

export async function createPromotion(request: Request, response: Response) {
  const body = promotionSchema.parse(request.body);

  if (body.productId) {
    const product = await prisma.product.findFirst({
      where: { id: body.productId, restaurantId: request.user!.restaurantId },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Produto da promocao nao encontrado.");
    }
  }

  if (body.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, restaurantId: request.user!.restaurantId },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError(404, "Categoria da promocao nao encontrada.");
    }
  }

  const promotion = await prisma.promotion.create({
    data: promotionCreateData({
      restaurantId: request.user!.restaurantId,
      ...body,
    }),
  });

  return response.status(201).json(ok({ promotion }));
}

export async function updatePromotion(request: Request, response: Response) {
  const promotionId = String(request.params.id);
  const body = promotionUpdateSchema.parse(request.body);
  const current = await prisma.promotion.findFirst({
    where: { id: promotionId, restaurantId: request.user!.restaurantId, deletedAt: null },
  });

  if (!current) {
    throw new ApiError(404, "Promocao nao encontrada.");
  }

  if (body.productId) {
    const product = await prisma.product.findFirst({
      where: { id: body.productId, restaurantId: request.user!.restaurantId },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Produto da promocao nao encontrado.");
    }
  }

  if (body.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, restaurantId: request.user!.restaurantId },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError(404, "Categoria da promocao nao encontrada.");
    }
  }

  const updated = await prisma.promotion.update({
    where: { id: current.id },
    data: {
      title: body.title,
      type: body.type,
      value: body.value,
      active: body.active,
      description: body.description,
      productId: body.productId,
      categoryId: body.categoryId,
      minimumOrderAmount: body.minimumOrderAmount,
      highlightLabel: body.highlightLabel,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    },
  });

  return response.json(ok({ promotion: updated }));
}

export async function deletePromotion(request: Request, response: Response) {
  const promotionId = String(request.params.id);
  const promotion = await prisma.promotion.findFirst({
    where: { id: promotionId, restaurantId: request.user!.restaurantId, deletedAt: null },
    select: { id: true },
  });

  if (!promotion) {
    throw new ApiError(404, "Promocao nao encontrada.");
  }

  await prisma.promotion.update({
    where: { id: promotion.id },
    data: {
      active: false,
      deletedAt: new Date(),
    },
  });

  return response.json(ok({ deleted: true }));
}
