import { api } from "./client";
import { normalizeFinanceSummary, unwrapData } from "./helpers";
import type { FinanceSummary } from "../types";

export async function fetchFinanceSummary() {
  const { data } = await api.get("/finance/summary");
  return normalizeFinanceSummary(unwrapData<FinanceSummary>(data));
}
