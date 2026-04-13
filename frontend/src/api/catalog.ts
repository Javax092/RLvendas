import { api } from "./client";
import { normalizeCategory, normalizeProduct, unwrapData } from "./helpers";
import type { Category, Product, PublicMenuResponse } from "../types";

export async function fetchPublicMenu(slug: string) {
  const { data } = await api.get<{ data: PublicMenuResponse }>(`/menu/${slug}`);
  return data.data;
}

export async function fetchAdminProducts() {
  const { data } = await api.get<Product[] | { data: Product[] }>("/products");
  return unwrapData(data).map(normalizeProduct);
}

export async function fetchAdminCategories() {
  const { data } = await api.get<Category[] | { data: Category[] }>("/categories");
  return unwrapData(data).map(normalizeCategory);
}

export async function createProduct(payload: Partial<Product>) {
  const { data } = await api.post<Product | { data: Product }>("/products", payload);
  return normalizeProduct(unwrapData(data));
}

export async function createCategory(payload: Partial<Category>) {
  const { data } = await api.post<Category | { data: Category }>("/categories", payload);
  return normalizeCategory(unwrapData(data));
}
