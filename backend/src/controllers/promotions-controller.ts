import type { Request, Response } from "express";
import { buildPromotions } from "../services/promotions-service.js";
import { ok } from "../utils/api-response.js";

export async function listPromotions(request: Request, response: Response) {
  const data = await buildPromotions(request.user!.restaurantId);
  return response.json(ok(data));
}
