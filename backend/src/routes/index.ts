import { Router } from "express";
import { automationRoutes } from "./automation-routes.js";
import { billingRoutes } from "./billing-routes.js";
import { customersRoutes } from "./customers-routes.js";
import { financeRoutes } from "./finance-routes.js";
import { insightsRoutes } from "./insights-routes.js";
import { loyaltyRoutes } from "./loyalty-routes.js";
import { menuImportRoutes } from "./menu-import-routes.js";
import { onboardingRoutes } from "./onboarding-routes.js";
import { promotionsRoutes } from "./promotions-routes.js";
import { settingsRoutes } from "./settings-routes.js";
import { stockRoutes } from "./stock-routes.js";
import { analyticsRoutes } from "../modules/analytics/routes.js";
import { authRoutes } from "../modules/auth/routes.js";
import { listPublicCategories } from "../modules/categories/controller.js";
import { categoryRoutes } from "../modules/categories/routes.js";
import { createPublicOrder } from "../modules/orders/controller.js";
import { orderRoutes } from "../modules/orders/routes.js";
import { listPublicProducts } from "../modules/products/controller.js";
import { productRoutes } from "../modules/products/routes.js";
import { getPublicMenu, getPublicRestaurant } from "../modules/restaurants/controller.js";
import { restaurantRoutes } from "../modules/restaurants/routes.js";

export const apiRoutes = Router();
export const registeredApiRoutes = [
  "POST /api/auth/login",
  "POST /api/auth/register",
  "GET /api/auth/me",
  "GET /api/onboarding",
  "GET /api/insights",
  "GET /api/finance/summary",
  "GET /api/customers",
  "GET /api/customers/:id",
  "GET /api/loyalty/:customerId",
  "GET /api/stock/alerts",
  "GET /api/promotions",
  "GET /api/automations/whatsapp-templates",
  "GET /api/settings",
  "GET /api/billing/plans",
  "GET /api/menu/:slug",
  "POST /api/analytics",
  "GET /api/analytics",
  "GET /api/public/restaurants/:slug",
  "GET /api/public/restaurants/:slug/categories",
  "GET /api/public/restaurants/:slug/products",
  "POST /api/public/restaurants/:slug/orders"
] as const;

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/restaurants", restaurantRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/orders", orderRoutes);
apiRoutes.use("/analytics", analyticsRoutes);
apiRoutes.use("/onboarding", onboardingRoutes);
apiRoutes.use("/insights", insightsRoutes);
apiRoutes.use("/finance", financeRoutes);
apiRoutes.use("/customers", customersRoutes);
apiRoutes.use("/loyalty", loyaltyRoutes);
apiRoutes.use("/stock", stockRoutes);
apiRoutes.use("/promotions", promotionsRoutes);
apiRoutes.use("/automations", automationRoutes);
apiRoutes.use("/settings", settingsRoutes);
apiRoutes.use("/billing", billingRoutes);
apiRoutes.use("/menu-import", menuImportRoutes);

apiRoutes.get("/menu/:slug", getPublicMenu);
apiRoutes.get("/public/restaurants/:slug", getPublicRestaurant);
apiRoutes.get("/public/restaurants/:slug/categories", listPublicCategories);
apiRoutes.get("/public/restaurants/:slug/products", listPublicProducts);
apiRoutes.post("/public/restaurants/:slug/orders", createPublicOrder);
