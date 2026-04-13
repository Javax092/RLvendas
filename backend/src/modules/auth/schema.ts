import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const registerSchema = z.object({
  restaurantName: z.string().trim().min(2),
  restaurantSlug: z.string().trim().regex(slugRegex, "Slug invalido."),
  whatsappNumber: z.string().trim().min(8),
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6)
});
