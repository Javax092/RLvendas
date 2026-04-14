import { api, setAuthToken } from "./client";

export type RestaurantSession = {
  id?: string;
  slug: string;
  name: string;
  plan?: string;
};

export type AuthUser = {
  id: string;
  name?: string;
  email: string;
  role?: string;
  restaurant?: RestaurantSession;
};

export type LoginResponse = {
  token: string;
  user?: AuthUser;
  restaurant?: RestaurantSession;
};

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser | { data: AuthUser }>("/auth/me");

  if ("data" in data) {
    return data.data;
  }

  return data;
}

export function restoreAuth() {
  const raw = window.localStorage.getItem("rlburger:session");

  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as { token?: string };
    if (parsed?.token) {
      setAuthToken(parsed.token);
    }
  } catch {
    window.localStorage.removeItem("rlburger:session");
    setAuthToken(undefined);
  }
}

export function logout() {
  window.localStorage.removeItem("rlburger:session");
  setAuthToken(undefined);
}
