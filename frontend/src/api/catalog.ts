import { api } from "./client";
import { normalizeCategory, normalizeProduct, normalizePublicMenuResponse, unwrapData } from "./helpers";
import type { Category, Product, PublicMenuResponse } from "../types";

const publicMenuCache = new Map<string, PublicMenuResponse>();
const MENU_STORAGE_KEY = "don-burguer-saas-menu-cache";

function loadPersistedMenus() {
  if (typeof window === "undefined") {
    return {} as Record<string, PublicMenuResponse>;
  }

  try {
    const raw = window.localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, PublicMenuResponse>;

    return Object.fromEntries(
      Object.entries(parsed).map(([slug, menu]) => [slug, normalizePublicMenuResponse(menu)]),
    );
  } catch {
    return {};
  }
}

function persistMenu(slug: string, payload: PublicMenuResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const cache = loadPersistedMenus();
  cache[slug] = payload;
  window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(cache));
}

export async function fetchPublicMenu(slug: string) {
  const cacheKey = slug.trim().toLowerCase();
  const cached = publicMenuCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const persisted = loadPersistedMenus()[cacheKey];

  if (persisted) {
    publicMenuCache.set(cacheKey, persisted);
  }

  try {
    const { data } = await api.get<{ data: PublicMenuResponse }>(`/menu/${slug}`);
    const normalizedMenu = normalizePublicMenuResponse(data.data);
    publicMenuCache.set(cacheKey, normalizedMenu);
    persistMenu(cacheKey, normalizedMenu);
    return normalizedMenu;
  } catch (error) {
    if (persisted) {
      return persisted;
    }

    throw error;
  }
}

export function prefetchPublicMenu(slug: string) {
  return fetchPublicMenu(slug).catch(() => undefined);
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
