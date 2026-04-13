import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const updateRestaurantSchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().regex(slugRegex, "Slug invalido.").optional(),
  description: z.string().trim().min(1).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().trim().min(4).optional(),
  secondaryColor: z.string().trim().min(4).optional(),
  whatsappNumber: z.string().trim().min(8).optional(),
  customDomain: z.string().trim().min(3).nullable().optional(),
  isAiUpsellOn: z.boolean().optional(),
  plan: z.enum(["BASIC", "PRO", "PREMIUM"]).optional()
});

export const updateSettingsSchema = z.object({
  heroTitle: z.string().trim().min(2).optional(),
  heroSubtitle: z.string().trim().min(2).optional(),
  bannerUrl: z.string().url().nullable().optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  estimatedTimeMin: z.coerce.number().int().min(1).optional(),
  estimatedTimeMax: z.coerce.number().int().min(1).optional(),
  seoTitle: z.string().trim().min(2).nullable().optional(),
  seoDescription: z.string().trim().min(2).nullable().optional()
});
