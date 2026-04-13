import { api } from "./client";
import { normalizePromotion, unwrapData } from "./helpers";
import type { Promotion } from "../types";

export async function fetchPromotions() {
  const { data } = await api.get("/promotions");
  const payload = unwrapData<{ promotions: Promotion[] }>(data);
  return (payload.promotions ?? []).map(normalizePromotion);
}
