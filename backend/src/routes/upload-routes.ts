import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { uploadImage } from "../controllers/upload-controller.js";
import { ensureAuth } from "../middleware/auth.js";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDir),
  filename: (_request, file, callback) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    callback(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({ storage });

export const uploadRoutes = Router();

uploadRoutes.post("/image", ensureAuth, upload.single("file"), uploadImage);

