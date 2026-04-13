import { Router } from "express";
import { createOrder, getUpsellSuggestion, listOrders } from "../controllers/orders-controller.js";
import { ensureAuth } from "../middleware/auth.js";

export const orderRoutes = Router();

orderRoutes.post("/", createOrder);
orderRoutes.post("/upsell", getUpsellSuggestion);
orderRoutes.get("/", ensureAuth, listOrders);

