import { Router } from "express";
import { getOnboardingStatus } from "../controllers/onboarding-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const onboardingRoutes = Router();

onboardingRoutes.get("/", ensureAuth, getOnboardingStatus);
