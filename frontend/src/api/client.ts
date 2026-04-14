import axios from "axios";
import { normalizeApiError } from "./helpers";

function normalizeApiBaseUrl(rawBaseUrl: string | undefined) {
  const value = rawBaseUrl?.trim();

  if (!value) {
    throw new Error(
      "VITE_API_URL must be defined. Example: http://localhost:3333/api or https://your-backend.up.railway.app/api",
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_URL must be a valid absolute URL. Received "${rawBaseUrl ?? ""}".`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`VITE_API_URL must use http or https. Received "${url.protocol}".`);
  }

  const normalized = value.replace(/\/+$/, "");

  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export { baseURL as apiBaseUrl };
