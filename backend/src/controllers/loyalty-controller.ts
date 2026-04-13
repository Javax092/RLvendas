import type { Request, Response } from "express";
import { buildLoyaltySummary } from "../services/loyalty-service.js";
import { ok } from "../utils/api-response.js";

export async function getLoyaltyByCustomer(request: Request, response: Response) {
  const data = await buildLoyaltySummary(request.user!.restaurantId, String(request.params.customerId));

  if (!data) {
    return response.status(404).json({
      success: false,
      error: {
        message: "Programa de fidelidade nao encontrado para este cliente."
      }
    });
  }

  return response.json(ok(data));
}
