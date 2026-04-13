import { Router } from "express";
import { listWhatsappTemplates } from "../controllers/automation-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const automationRoutes = Router();

automationRoutes.get("/whatsapp-templates", ensureAuth, listWhatsappTemplates);
