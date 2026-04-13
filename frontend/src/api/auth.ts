import { api } from "./client";
import { unwrapData } from "./helpers";
import type { LoginResponse } from "../types";

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse | { data: LoginResponse }>("/auth/login", { email, password });
  return unwrapData(data);
}

export async function fetchMe() {
  const { data } = await api.get<{ data: LoginResponse["user"] & { restaurant: LoginResponse["restaurant"] } }>("/auth/me");
  return unwrapData(data);
}
