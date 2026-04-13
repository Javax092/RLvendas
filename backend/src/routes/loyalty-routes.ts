import { Router } from "express";
import { getLoyaltyByCustomer } from "../controllers/loyalty-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const loyaltyRoutes = Router();

loyaltyRoutes.get("/:customerId", ensureAuth, getLoyaltyByCustomer);
