import { api } from "./client";
import { normalizePromotion, unwrapData } from "./helpers";
import type { Promotion } from "../types";

export async function fetchPromotions() {
  const { data } = await api.get("/promotions");
  const payload = unwrapData<{ promotions: Promotion[] }>(data);
  return (payload.promotions ?? []).map(normalizePromotion);
}

export async function createPromotion(payload: Record<string, unknown>) {
  const { data } = await api.post("/promotions", payload);
  return normalizePromotion(unwrapData<{ promotion: Promotion }>(data).promotion);
}

export async function updatePromotion(promotionId: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/promotions/${promotionId}`, payload);
  return normalizePromotion(unwrapData<{ promotion: Promotion }>(data).promotion);
}

export async function deletePromotion(promotionId: string) {
  const { data } = await api.delete(`/promotions/${promotionId}`);
  return unwrapData<{ deleted: boolean }>(data);
}
