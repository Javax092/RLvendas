import type { Request, Response } from "express";
import { buildInsights } from "../services/insights-service.js";
import { ok } from "../utils/api-response.js";

export async function getInsights(request: Request, response: Response) {
  const data = await buildInsights(request.user!.restaurantId);
  return response.json(ok(data));
}
