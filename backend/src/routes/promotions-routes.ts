import { Router } from "express";
import { listPromotions } from "../controllers/promotions-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const promotionsRoutes = Router();

promotionsRoutes.get("/", ensureAuth, listPromotions);
