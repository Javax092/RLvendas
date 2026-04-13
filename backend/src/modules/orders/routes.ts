import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import { createPublicOrder, getOrder, listOrders, updateOrderStatus } from "./controller.js";

export const orderRoutes = Router();

orderRoutes.post("/public/:slug", createPublicOrder);
orderRoutes.get("/", ensureAuth, listOrders);
orderRoutes.get("/:id", ensureAuth, getOrder);
orderRoutes.patch("/:id/status", ensureAuth, updateOrderStatus);
