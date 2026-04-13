import { Router } from "express";
import { getStockAlerts } from "../controllers/stock-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const stockRoutes = Router();

stockRoutes.get("/alerts", ensureAuth, getStockAlerts);
