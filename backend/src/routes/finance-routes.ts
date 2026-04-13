import { Router } from "express";
import { getFinanceSummary } from "../controllers/finance-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const financeRoutes = Router();

financeRoutes.get("/summary", ensureAuth, getFinanceSummary);
