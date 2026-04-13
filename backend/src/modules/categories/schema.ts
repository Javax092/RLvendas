import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().regex(slugRegex, "Slug invalido.").optional(),
  description: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const updateCategorySchema = createCategorySchema.partial();
