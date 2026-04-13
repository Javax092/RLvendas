import { api } from "./client";
import { unwrapData } from "./helpers";
import type { StockAlertsResponse } from "../types";

export async function fetchStockAlerts() {
  const { data } = await api.get("/stock/alerts");
  return unwrapData<StockAlertsResponse>(data);
}
