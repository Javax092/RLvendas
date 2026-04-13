import { api } from "./client";
import { normalizeBillingSnapshot, unwrapData } from "./helpers";

export async function fetchPlans() {
  const { data } = await api.get("/billing/plans");
  return normalizeBillingSnapshot(unwrapData(data));
}
