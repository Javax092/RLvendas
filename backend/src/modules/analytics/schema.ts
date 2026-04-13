import { z } from "zod";

export const createAnalyticsEventSchema = z.object({
  restaurantSlug: z.string().trim().min(1),
  type: z.enum([
    "page_view",
    "add_to_cart",
    "start_checkout",
    "order_sent",
    "menu_viewed",
    "product_added",
    "checkout_completed",
    "checkout_started",
    "order_created"
  ]),
  payload: z.record(z.unknown()).optional()
});
