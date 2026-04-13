import { api } from "./client";
import { normalizeSettings, unwrapData } from "./helpers";
import type { RestaurantAdminSettings } from "../types";

export async function fetchSettings() {
  const { data } = await api.get("/settings");
  return normalizeSettings(unwrapData(data));
}

export async function updateSettings(payload: RestaurantAdminSettings) {
  const { data } = await api.put("/settings", payload);
  return normalizeSettings(unwrapData(data));
}
