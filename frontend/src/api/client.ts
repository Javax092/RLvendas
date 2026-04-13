import axios from "axios";
import { normalizeApiError } from "./helpers";

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const fallbackBaseUrl = "http://localhost:3333/api";
  const resolvedBaseUrl = (rawBaseUrl || fallbackBaseUrl).trim().replace(/\/+$/, "");

  if (resolvedBaseUrl.endsWith("/api")) {
    return resolvedBaseUrl;
  }

  return `${resolvedBaseUrl}/api`;
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
