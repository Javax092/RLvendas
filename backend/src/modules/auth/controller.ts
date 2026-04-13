import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { registerSchema, loginSchema } from "./schema.js";

function signToken(user: { id: string; restaurantId: string; role: string }) {
  return jwt.sign(
    {
      restaurantId: user.restaurantId,
      role: user.role
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: "7d"
    }
  );
}

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export const register = asyncHandler(async (request: Request, response: Response) => {
  const body = registerSchema.parse(request.body);

  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { slug: body.restaurantSlug }
  });

  if (existingRestaurant) {
    throw new ApiError(409, "Slug do restaurante ja esta em uso.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  });

  if (existingUser) {
    throw new ApiError(409, "Email ja cadastrado.");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: body.restaurantName,
        slug: body.restaurantSlug,
        whatsappNumber: body.whatsappNumber,
        settings: {
          create: {}
        }
      }
    });

    const user = await tx.user.create({
      data: {
        restaurantId: restaurant.id,
        name: body.name,
        email: body.email,
        passwordHash,
        role: "owner"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        restaurantId: true,
        createdAt: true
      }
    });

    return { restaurant, user };
  });

  const token = signToken({
    id: result.user.id,
    restaurantId: result.user.restaurantId,
    role: result.user.role
  });

  return response.status(201).json({
    data: {
      token,
      user: result.user,
      restaurant: result.restaurant
    }
  });
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const body = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: {
      restaurant: true
    }
  });

  if (!user) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  const passwordMatches = isBcryptHash(user.passwordHash)
    ? await bcrypt.compare(body.password, user.passwordHash)
    : body.password === user.passwordHash;

  if (!passwordMatches) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  if (!isBcryptHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(body.password, 10)
      }
    });
  }

  const token = signToken(user);

  return response.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    },
    restaurant: user.restaurant
  });
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  const authUser = request.user;

  if (!authUser) {
    throw new ApiError(401, "Nao autenticado.");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: authUser.id,
      restaurantId: authUser.restaurantId
    },
    include: {
      restaurant: true
    }
  });

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado.");
  }

  return response.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: user.restaurant
    }
  });
});
