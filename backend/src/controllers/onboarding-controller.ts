import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../utils/api-response.js";

export async function getOnboardingStatus(request: Request, response: Response) {
  const restaurantId = request.user!.restaurantId;

  const [productsCount, restaurant, ordersCount] = await Promise.all([
    prisma.product.count({ where: { restaurantId, isActive: true } }),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { settings: true }
    }),
    prisma.order.count({ where: { restaurantId } })
  ]);

  const steps = [
    {
      key: "profile",
      label: "Perfil configurado",
      done: Boolean(restaurant?.name && restaurant?.whatsappNumber)
    },
    {
      key: "catalog",
      label: "Catalogo criado",
      done: productsCount > 0
    },
    {
      key: "whatsapp",
      label: "WhatsApp conectado",
      done: Boolean(restaurant?.whatsappNumber)
    }
  ];

  if (ordersCount > 0) {
    steps.push({
      key: "orders",
      label: "Primeiros pedidos recebidos",
      done: true
    });
  }

  const completedItems = steps.filter((item) => item.done).length;
  const progress = steps.length === 0 ? 0 : Math.round((completedItems / steps.length) * 100);

  return response.json(
    ok({
      completed: completedItems === steps.length,
      progress,
      steps
    })
  );
}
