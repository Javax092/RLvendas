import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  listPublicCategories,
  updateCategory
} from "./controller.js";

export const categoryRoutes = Router();

categoryRoutes.post("/", ensureAuth, createCategory);
categoryRoutes.get("/", ensureAuth, listCategories);
categoryRoutes.put("/:id", ensureAuth, updateCategory);
categoryRoutes.delete("/:id", ensureAuth, deleteCategory);
