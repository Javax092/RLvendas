import { Router } from "express";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "../controllers/promotions-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const promotionsRoutes = Router();

promotionsRoutes.get("/", ensureAuth, listPromotions);
promotionsRoutes.post("/", ensureAuth, createPromotion);
promotionsRoutes.put("/:id", ensureAuth, updatePromotion);
promotionsRoutes.delete("/:id", ensureAuth, deletePromotion);
