import type { Request, Response } from "express";
import { getCustomerById, buildCustomersRanking } from "../services/customers-service.js";
import { ok } from "../utils/api-response.js";

export async function listCustomers(request: Request, response: Response) {
  const customers = await buildCustomersRanking(request.user!.restaurantId);
  return response.json(ok({ customers }));
}

export async function getCustomer(request: Request, response: Response) {
  const customer = await getCustomerById(request.user!.restaurantId, String(request.params.id));

  if (!customer) {
    return response.status(404).json({
      success: false,
      error: {
        message: "Cliente nao encontrado."
      }
    });
  }

  return response.json(ok(customer));
}
