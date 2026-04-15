import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { toSafeNumber } from "../../utils/money.js";
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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [events, grouped, orders, todayOrders, itemStats, profitableProducts] = await Promise.all([
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
        status: true,
        createdAt: true
      }
    }),
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startOfToday
        }
      },
      select: {
        total: true,
        status: true
      }
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          restaurantId
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    }),
    prisma.product.findMany({
      where: {
        restaurantId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        costPrice: true
      }
    })
  ]);

  const totalRevenue = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + toSafeNumber(order.total), 0);
  const validTodayOrders = todayOrders.filter((order) => order.status !== "CANCELLED");
  const todayRevenue = validTodayOrders.reduce((sum, order) => sum + toSafeNumber(order.total), 0);
  const averageTicket = orders.length ? totalRevenue / orders.length : 0;
  const productMap = new Map(profitableProducts.map((product) => [product.id, product]));
  const topProducts = itemStats.map((item) => {
    const product = productMap.get(item.productId);
    return {
      id: item.productId,
      name: product?.name ?? "Produto",
      quantity: toSafeNumber(item._sum.quantity ?? 0),
      revenue: toSafeNumber(item._sum.totalPrice ?? 0)
    };
  });
  const topProfitableProducts = profitableProducts
    .map((product) => {
      const revenue = topProducts.find((item) => item.id === product.id)?.revenue ?? 0;
      const cost = toSafeNumber(product.costPrice ?? 0);
      const unitPrice = toSafeNumber(product.price);
      const estimatedMargin = unitPrice - cost;

      return {
        id: product.id,
        name: product.name,
        estimatedProfit: revenue > 0 && unitPrice > 0 ? (revenue / unitPrice) * estimatedMargin : 0
      };
    })
    .sort((left, right) => right.estimatedProfit - left.estimatedProfit)
    .slice(0, 5);

  return response.json({
    data: {
      today: {
        orders: validTodayOrders.length,
        revenue: todayRevenue,
        averageTicket: validTodayOrders.length ? todayRevenue / validTodayOrders.length : 0
      },
      summary: grouped.map((item) => ({
        type: item.type,
        count: item._count.type
      })),
      totalOrders: orders.length,
      totalRevenue,
      averageTicket,
      topProducts,
      topProfitableProducts,
      recentEvents: events
    }
  });
});
