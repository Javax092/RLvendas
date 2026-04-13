import axios from "axios";
import { normalizeApiError } from "./helpers";

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const isProduction = import.meta.env.PROD;
  const fallbackBaseUrl = "http://localhost:3333/api";

  if (!rawBaseUrl && isProduction) {
    throw new Error("VITE_API_URL must be defined for production builds.");
  }

  const resolvedBaseUrl = (rawBaseUrl || fallbackBaseUrl)
    .trim()
    .replace(/\/+$/, "");

  if (isProduction) {
    const url = new URL(
      resolvedBaseUrl.endsWith("/api")
        ? resolvedBaseUrl
        : `${resolvedBaseUrl}/api`,
    );

    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      throw new Error("VITE_API_URL cannot point to localhost in production.");
    }
  }

  if (resolvedBaseUrl.endsWith("/api")) {
    return resolvedBaseUrl;
  }

  return `${resolvedBaseUrl}/api`;
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: "${import.meta.env.VITE_API_URL}/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
