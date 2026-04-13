import { api } from "./client";
import { normalizeCustomer, normalizeLoyalty, unwrapData } from "./helpers";
import type { Customer, LoyaltySummary } from "../types";

export async function fetchCustomers() {
  const { data } = await api.get("/customers");
  const payload = unwrapData<{ customers: Customer[] }>(data);
  return (payload.customers ?? []).map(normalizeCustomer);
}

export async function fetchCustomer(customerId: string) {
  const { data } = await api.get(`/customers/${customerId}`);
  return normalizeCustomer(unwrapData<Customer>(data));
}

export async function fetchLoyalty(customerId: string) {
  const { data } = await api.get(`/loyalty/${customerId}`);
  return normalizeLoyalty(unwrapData<LoyaltySummary>(data));
}
