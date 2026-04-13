import { Router } from "express";
import multer from "multer";
import { importMenuFromFile, importMenuFromText, previewMenuImport } from "../controllers/menu-import-controller.js";
import { ensureAuth } from "../middlewares/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

export const menuImportRoutes = Router();

menuImportRoutes.post("/preview", ensureAuth, previewMenuImport);
menuImportRoutes.post("/text", ensureAuth, importMenuFromText);
menuImportRoutes.post("/file", ensureAuth, upload.single("file"), importMenuFromFile);
