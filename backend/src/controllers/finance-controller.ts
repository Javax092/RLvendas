import type { Request, Response } from "express";
import { buildFinanceSummary } from "../services/finance-service.js";
import { ok } from "../utils/api-response.js";

export async function getFinanceSummary(request: Request, response: Response) {
  const data = await buildFinanceSummary(request.user!.restaurantId);
  return response.json(ok(data));
}
