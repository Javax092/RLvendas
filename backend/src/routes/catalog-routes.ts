import { Router } from "express";
import {
  createCategory,
  createProduct,
  getPublicMenu,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct
} from "../controllers/catalog-controller.js";
import { ensureAuth } from "../middleware/auth.js";

export const catalogRoutes = Router();

catalogRoutes.get("/menu/:slug", getPublicMenu);
catalogRoutes.get("/categories", ensureAuth, listCategories);
catalogRoutes.post("/categories", ensureAuth, createCategory);
catalogRoutes.put("/categories/:id", ensureAuth, updateCategory);
catalogRoutes.get("/products", ensureAuth, listProducts);
catalogRoutes.post("/products", ensureAuth, createProduct);
catalogRoutes.put("/products/:id", ensureAuth, updateProduct);

