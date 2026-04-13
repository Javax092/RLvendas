import type { Request, Response } from "express";
import { buildStockAlerts } from "../services/stock-service.js";
import { ok } from "../utils/api-response.js";

export async function getStockAlerts(request: Request, response: Response) {
  const data = await buildStockAlerts(request.user!.restaurantId);
  return response.json(ok(data));
}
