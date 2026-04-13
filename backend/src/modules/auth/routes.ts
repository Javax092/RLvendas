import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import { login, me, register } from "./controller.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", ensureAuth, me);
