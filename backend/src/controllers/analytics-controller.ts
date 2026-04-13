import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const eventSchema = z.object({
  restaurantSlug: z.string(),
  type: z.string().min(2),
  payload: z.record(z.any()).optional()
});

export async function trackEvent(request: Request, response: Response) {
  const body = eventSchema.parse(request.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: body.restaurantSlug }
  });

  if (!restaurant) {
    return response.status(404).json({ message: "Restaurante nao encontrado" });
  }

  await prisma.analyticsEvent.create({
    data: {
      restaurantId: restaurant.id,
      type: body.type,
      payload: body.payload
    }
  });

  return response.status(201).json({ success: true });
}

