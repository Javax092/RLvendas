import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createProductSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  slug: z.string().trim().regex(slugRegex, "Slug invalido.").optional(),
  description: z.string().trim().min(2),
  imageUrl: z.string().url().nullable().optional(),
  price: z.coerce.number().positive(),
  costPrice: z.coerce.number().nonnegative().nullable().optional(),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  productType: z.enum(["SINGLE", "COMBO", "ADDON"]).optional(),
  tags: z.array(z.string().trim().min(1)).optional()
});

export const updateProductSchema = createProductSchema.partial();
