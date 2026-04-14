import { api, setAuthToken } from "./client";
import { unwrapData } from "./helpers";

export const AUTH_STORAGE_KEY = "rlburger:session";

export type SessionRestaurant = {
  id: string;
  slug: string;
  name: string;
  plan: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  restaurant: SessionRestaurant;
};

export type AuthSessionSnapshot = Omit<AuthSession, "token">;

function normalizeRestaurant(raw: unknown): SessionRestaurant {
  const restaurant = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(restaurant.id ?? ""),
    slug: String(restaurant.slug ?? ""),
    name: String(restaurant.name ?? "Restaurante"),
    plan: String(restaurant.plan ?? "BASIC"),
  };
}

function normalizeUser(raw: unknown, restaurantId?: string): AuthUser {
  const user = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(user.id ?? ""),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    role: String(user.role ?? "owner"),
    restaurantId:
      typeof user.restaurantId === "string"
        ? user.restaurantId
        : restaurantId,
  };
}

function normalizeLoginResponse(payload: unknown): AuthSession {
  const raw = payload as Record<string, unknown>;
  const restaurant = normalizeRestaurant(raw.restaurant);
  const user = normalizeUser(raw.user, restaurant.id);

  return {
    token: String(raw.token ?? ""),
    user,
    restaurant,
  };
}

function normalizeMeResponse(payload: unknown): AuthSessionSnapshot {
  const raw = unwrapData(payload) as Record<string, unknown>;
  const restaurant = normalizeRestaurant(raw.restaurant);
  const user = normalizeUser(raw.user, restaurant.id);

  return {
    user,
    restaurant,
  };
}

export function persistAuth(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSession> {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });

  const session = normalizeLoginResponse(data);

  if (session.token) {
    setAuthToken(session.token);
  }

  return session;
}

export async function fetchMe(): Promise<AuthSessionSnapshot> {
  const { data } = await api.get("/auth/me");
  return normalizeMeResponse(data);
}

export function restoreAuth(): AuthSession | undefined {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    setAuthToken(undefined);
    return undefined;
  }

  try {
    const session = normalizeLoginResponse(JSON.parse(raw));

    if (!session.token) {
      throw new Error("Sessao invalida.");
    }

    setAuthToken(session.token);
    return session;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken(undefined);
    return undefined;
  }
}

export function logout() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  setAuthToken(undefined);
}
