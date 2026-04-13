import { api } from "./client";
import { normalizeInsights, unwrapData } from "./helpers";

export async function fetchInsights() {
  const { data } = await api.get("/insights");
  return normalizeInsights(unwrapData(data));
}
