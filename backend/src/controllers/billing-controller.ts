import type { Request, Response } from "express";
import { ok } from "../utils/api-response.js";

export function listPlans(_request: Request, response: Response) {
  return response.json(
    ok({
      currentPlan: {
        name: "Pro",
        price: 99.9,
        status: "active"
      },
      availablePlans: [
        { id: "starter", name: "Starter", price: 49.9 },
        { id: "pro", name: "Pro", price: 99.9 },
        { id: "scale", name: "Scale", price: 199.9 }
      ]
    })
  );
}
