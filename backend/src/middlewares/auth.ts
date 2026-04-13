import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";

type JwtPayload = {
  sub?: string;
  restaurantId?: string;
  role?: string;
};

export async function ensureAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization?.trim();

  if (!header) {
    return next(new ApiError(401, "Token nao informado."));
  }

  const parts = header.split(/\s+/);
  const token =
    parts.length === 1
      ? parts[0]
      : parts[0].toLowerCase() === "bearer"
        ? parts[1]
        : undefined;

  if (!token) {
    return next(new ApiError(401, "Token invalido."));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const userId = payload.sub;

    if (!userId) {
      return next(new ApiError(401, "Token invalido."));
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        role: true,
        restaurantId: true
      }
    });

    if (!user) {
      return next(new ApiError(401, "Usuario autenticado nao encontrado."));
    }

    request.user = user;
    return next();
  } catch {
    return next(new ApiError(401, "Token invalido."));
  }
}
