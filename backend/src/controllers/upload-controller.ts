import { Request, Response } from "express";
import path from "node:path";

export function uploadImage(request: Request, response: Response) {
  const file = request.file;

  if (!file?.path) {
    return response.status(400).json({ message: "Arquivo nao enviado" });
  }

  return response.status(201).json({
    url: `/uploads/${path.basename(file.path)}`
  });
}
