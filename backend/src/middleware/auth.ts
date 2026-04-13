import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "../utils/http-error.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      restaurantId: string;
      email: string;
    };
  }
}

export function ensureAuth(request: Request, _response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new HttpError(401, "Token nao informado");
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    throw new HttpError(401, "Token invalido");
  }

  const payload = verifyToken(token);

  request.user = {
    id: payload.sub,
    restaurantId: payload.restaurantId,
    email: payload.email
  };

  next();
}

