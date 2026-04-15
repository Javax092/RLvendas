import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof Error && error.message.startsWith("Not allowed by CORS:")) {
    return response.status(403).json({
      error: {
        message: "Origem nao permitida por CORS."
      }
    });
  }

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

    if (error.code === "P2025") {
      return response.status(404).json({
        error: {
          message: "Registro nao encontrado."
        }
      });
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const message = error.message.includes("Can't reach database server")
      ? "Banco de dados indisponivel. Verifique DATABASE_URL e DIRECT_URL."
      : "Falha ao inicializar a conexao com o banco de dados.";

    console.error(`[db:init] ${error.message}`);

    return response.status(503).json({
      error: {
        message
      }
    });
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error(`[db:panic] ${error.message}`);

    return response.status(503).json({
      error: {
        message: "O cliente do banco de dados falhou durante a execucao."
      }
    });
  }

  if (error instanceof Error) {
    console.error(`[500] ${_request.method} ${_request.originalUrl} ${error.message}`);

    if (env.NODE_ENV !== "production") {
      console.error(error.stack);
    }
  } else {
    console.error("[500] Unexpected non-error thrown", error);
  }

  return response.status(500).json({
    error: {
      message: "Erro interno do servidor."
    }
  });
}
