import { Router } from "express";
import { getCustomer, listCustomers } from "../controllers/customers-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

export const customersRoutes = Router();

customersRoutes.get("/", ensureAuth, listCustomers);
customersRoutes.get("/:id", ensureAuth, getCustomer);
