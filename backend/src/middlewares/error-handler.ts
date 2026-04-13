import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: {
        message: "Dados invalidos.",
        issues: error.flatten()
      }
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: {
        message: error.message
      }
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(409).json({
        error: {
          message: "Registro duplicado para um campo unico."
        }
      });
    }
  }

  if (error instanceof Error) {
    console.error(`[500] ${error.message}`);
    console.error(error.stack);
  } else {
    console.error("[500] Unexpected non-error thrown", error);
  }

  return response.status(500).json({
    error: {
      message: "Erro interno do servidor."
    }
  });
}
