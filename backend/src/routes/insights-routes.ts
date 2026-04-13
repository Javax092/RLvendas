import { Router } from "express";
import { getInsights } from "../controllers/insights-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const insightsRoutes = Router();

insightsRoutes.get("/", ensureAuth, getInsights);
