import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { signToken } from "../utils/jwt.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6)
});

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function login(request: Request, response: Response) {
  const body = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: { restaurant: true }
  });

  if (!user) {
    throw new HttpError(401, "Credenciais invalidas");
  }

  const passwordMatch = isBcryptHash(user.passwordHash)
    ? await bcrypt.compare(body.password, user.passwordHash)
    : body.password === user.passwordHash;

  if (!passwordMatch) {
    throw new HttpError(401, "Credenciais invalidas");
  }

  if (!isBcryptHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(body.password, 10)
      }
    });
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    restaurantId: user.restaurantId
  });

  return response.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    restaurant: {
      id: user.restaurant.id,
      name: user.restaurant.name,
      slug: user.restaurant.slug,
      plan: user.restaurant.plan
    }
  });
}

export async function me(request: Request, response: Response) {
  const user = await prisma.user.findUnique({
    where: { id: request.user?.id },
    include: { restaurant: true }
  });

  if (!user) {
    throw new HttpError(404, "Usuario nao encontrado");
  }

  return response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    restaurant: user.restaurant
  });
}
