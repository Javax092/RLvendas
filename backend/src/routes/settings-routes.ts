import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const settingsRoutes = Router();

settingsRoutes.get("/", ensureAuth, getSettings);
settingsRoutes.put("/", ensureAuth, updateSettings);
