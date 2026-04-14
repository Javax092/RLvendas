import { api } from "./client";
import { normalizeOrder, unwrapData } from "./helpers";
import type { Order } from "../types";

type PublicOrderResponse = Pick<Order, "id" | "total" | "status" | "whatsappMessage" | "whatsappUrl">;

export async function createPublicOrder(
  restaurantSlug: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.post<PublicOrderResponse | { data: PublicOrderResponse }>(
    `/public/restaurants/${restaurantSlug}/orders`,
    payload,
  );
  return unwrapData(data);
}

export async function fetchOrders() {
  const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
  return unwrapData<Order[]>(data).map(normalizeOrder);
}

export async function fetchPublicUpsell(
  restaurantSlug: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.post<{ suggestion: { id: string; name: string; price: number; reason?: string | null } | null }>(
    `/public/restaurants/${restaurantSlug}/upsell`,
    payload,
  );

  return {
    ...data,
    suggestion: data.suggestion
      ? {
          ...data.suggestion,
          price: Number(data.suggestion.price) || 0,
        }
      : null,
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data } = await api.patch<Order | { data: Order }>(`/orders/${orderId}/status`, { status });
  return normalizeOrder(unwrapData(data));
}
