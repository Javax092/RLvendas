import axios from "axios";
import { normalizeApiError } from "./helpers";

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const isProduction = import.meta.env.PROD;
  const fallbackBaseUrl = "http://localhost:3333";

  if (!rawBaseUrl && isProduction) {
    throw new Error("VITE_API_URL must be defined for production builds.");
  }

  const resolvedBaseUrl = (rawBaseUrl || fallbackBaseUrl)
    .trim()
    .replace(/\/+$/, "");

  if (resolvedBaseUrl.endsWith("/api")) {
    return resolvedBaseUrl;
  }

  return `${resolvedBaseUrl}/api`;
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL,
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
