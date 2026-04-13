import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import {
  getMyRestaurant,
  getMySettings,
  getPublicRestaurant,
  updateMyRestaurant,
  updateMySettings
} from "./controller.js";

export const restaurantRoutes = Router();

restaurantRoutes.get("/me", ensureAuth, getMyRestaurant);
restaurantRoutes.put("/me", ensureAuth, updateMyRestaurant);
restaurantRoutes.get("/me/settings", ensureAuth, getMySettings);
restaurantRoutes.put("/me/settings", ensureAuth, updateMySettings);
