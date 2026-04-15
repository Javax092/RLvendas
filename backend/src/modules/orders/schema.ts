import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(8).nullable().optional(),
  customerAddress: z.string().trim().min(5).nullable().optional(),
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).optional(),
  paymentMethod: z.string().trim().min(2),
  notes: z.string().trim().min(1).nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1),
        notes: z.string().trim().min(1).nullable().optional()
      })
    )
    .min(1)
});

export const publicUpsellSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.coerce.number().int().min(1)
    })
  )
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"])
});
