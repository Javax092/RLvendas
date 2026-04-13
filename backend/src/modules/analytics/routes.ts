import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import { createAnalyticsEvent, listAnalytics } from "./controller.js";

export const analyticsRoutes = Router();

analyticsRoutes.post("/", createAnalyticsEvent);
analyticsRoutes.get("/", ensureAuth, listAnalytics);
