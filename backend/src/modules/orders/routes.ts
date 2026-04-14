import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import {
  createPublicOrder,
  getOrder,
  getPublicUpsellSuggestion,
  listOrders,
  updateOrderStatus,
} from "./controller.js";

export const orderRoutes = Router();

orderRoutes.post("/public/:slug", createPublicOrder);
orderRoutes.post("/public/:slug/upsell", getPublicUpsellSuggestion);
orderRoutes.get("/", ensureAuth, listOrders);
orderRoutes.get("/:id", ensureAuth, getOrder);
orderRoutes.patch("/:id/status", ensureAuth, updateOrderStatus);
