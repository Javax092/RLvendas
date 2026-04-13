import { Router } from "express";
import { listPlans } from "../controllers/billing-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const billingRoutes = Router();

billingRoutes.get("/plans", ensureAuth, listPlans);
