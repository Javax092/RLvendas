import { Router } from "express";
import { trackEvent } from "../controllers/analytics-controller.js";

export const analyticsRoutes = Router();

analyticsRoutes.post("/", trackEvent);

