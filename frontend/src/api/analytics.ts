import { api } from "./client";

export async function trackEvent(payload: Record<string, unknown>) {
  const { data } = await api.post("/analytics", payload);
  return data;
}
