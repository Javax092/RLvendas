import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listPublicProducts,
  updateProduct
} from "./controller.js";

export const productRoutes = Router();

productRoutes.post("/", ensureAuth, createProduct);
productRoutes.get("/", ensureAuth, listProducts);
productRoutes.get("/public/:slug", listPublicProducts);
productRoutes.get("/:id", ensureAuth, getProduct);
productRoutes.put("/:id", ensureAuth, updateProduct);
productRoutes.delete("/:id", ensureAuth, deleteProduct);
