import type { Request, Response } from "express";

export function notFoundHandler(request: Request, response: Response) {
  console.warn(`[404] ${request.method} ${request.originalUrl}`);
  return response.status(404).json({
    error: {
      message: "Route not found"
    },
    path: request.originalUrl,
    method: request.method
  });
}
