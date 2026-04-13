import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createAnalyticsEventSchema } from "./schema.js";

const analyticsTypeMap: Record<string, string> = {
  menu_viewed: "page_view",
  product_added: "add_to_cart",
  checkout_completed: "order_sent",
  checkout_started: "start_checkout",
  order_created: "order_sent"
};

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/burguer/g, "burger").replace(/[^a-z0-9]/g, "");
}

async function findRestaurantIdBySlug(slug: string) {
  const exactMatch = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, slug: true }
  });

  if (exactMatch) {
    return exactMatch.id;
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, slug: true }
  });

  return restaurants.find((restaurant) => normalizeSlug(restaurant.slug) === normalizeSlug(slug))?.id ?? null;
}

export const createAnalyticsEvent = asyncHandler(async (request: Request, response: Response) => {
  const body = createAnalyticsEventSchema.parse(request.body);
  const restaurantId = request.user?.restaurantId ?? (await findRestaurantIdBySlug(body.restaurantSlug));

  if (!restaurantId) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const type = analyticsTypeMap[body.type] ?? body.type;

  const event = await prisma.analyticsEvent.create({
    data: {
      restaurantId,
      type,
      payload: body.payload as Prisma.InputJsonValue | undefined
    }
  });

  return response.status(201).json({ data: event });
});

export const listAnalytics = asyncHandler(async (request: Request, response: Response) => {
  const restaurantId = request.user!.restaurantId;

  const [events, grouped, orders] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      where: { restaurantId },
      _count: {
        type: true
      }
    }),
    prisma.order.findMany({
      where: { restaurantId },
      select: {
        total: true,
        status: true
      }
    })
  ]);

  const totalRevenue = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total), 0);

  return response.json({
    data: {
      summary: grouped.map((item) => ({
        type: item.type,
        count: item._count.type
      })),
      totalOrders: orders.length,
      totalRevenue,
      recentEvents: events
    }
  });
});
