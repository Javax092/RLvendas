import { prisma } from "../lib/prisma.js";

export type AnalyticsOrder = Awaited<ReturnType<typeof getRestaurantOrders>>[number];
export type AnalyticsProduct = Awaited<ReturnType<typeof getRestaurantProducts>>[number];

export async function getRestaurantOrders(restaurantId: string) {
  return prisma.order.findMany({
    where: {
      restaurantId
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getRestaurantProducts(restaurantId: string) {
  return prisma.product.findMany({
    where: {
      restaurantId
    },
    include: {
      category: true
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });
}

export function numberValue(input: unknown, fallback = 0) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getOrderRevenue(order: { total: unknown; status: string }) {
  return order.status === "CANCELLED" ? 0 : numberValue(order.total);
}

export function getProductCost(product: { costPrice?: unknown; price: unknown }) {
  const explicitCost = numberValue(product.costPrice);
  if (explicitCost > 0) {
    return explicitCost;
  }

  return numberValue(product.price) * 0.35;
}

export function buildCustomerId(name: string, phone?: string | null) {
  const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const normalizedPhone = (phone ?? "sem-telefone").replace(/\D+/g, "");
  return `${normalizedName || "cliente"}-${normalizedPhone || "anonimo"}`;
}
