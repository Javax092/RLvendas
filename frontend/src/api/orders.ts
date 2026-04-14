import { api } from "./client";
import { normalizeOrder, unwrapData } from "./helpers";
import type { Order } from "../types";

export async function createPublicOrder(
  restaurantSlug: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.post<Order | { data: Order }>(
    `/public/restaurants/${restaurantSlug}/orders`,
    payload,
  );
  return normalizeOrder(unwrapData(data));
}

export async function fetchOrders() {
  const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
  return unwrapData(data).map(normalizeOrder);
}

export async function fetchPublicUpsell(
  restaurantSlug: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.post<{ suggestion: { id: string; name: string; price: number } | null }>(
    `/public/restaurants/${restaurantSlug}/upsell`,
    payload,
  );
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data } = await api.patch<Order | { data: Order }>(`/orders/${orderId}/status`, { status });
  return normalizeOrder(unwrapData(data));
}
