import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { fetchMe, loginRequest } from "../api/auth";
import { normalizeApiError } from "../api/helpers";
import { setAuthToken } from "../api/client";

type RestaurantSession = {
  id?: string;
  slug: string;
  name: string;
  plan?: string;
};

type AuthUser = {
  id: string;
  name?: string;
  email: string;
  role?: string;
  restaurant?: RestaurantSession;
};

type LoginResponse = {
  token: string;
  user?: AuthUser;
  restaurant?: RestaurantSession;
};

type AuthContextValue = {
  token?: string;
  session?: LoginResponse;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  loading: true,
  signIn: async () => undefined,
  signOut: () => undefined,
});

const storageKey = "rlburger:session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LoginResponse & { token: string };

      if (!parsed?.token) {
        throw new Error("Sessao invalida.");
      }

      setToken(parsed.token);
      setSession(parsed);
      setAuthToken(parsed.token);
    } catch {
      window.localStorage.removeItem(storageKey);
      setAuthToken(undefined);
      setLoading(false);
      return;
    }

    fetchMe()
      .then((me: AuthUser) => {
        setSession((current) =>
          current
            ? {
                ...current,
                user: {
                  id: me.id,
                  name: me.name,
                  email: me.email,
                  role: me.role,
                  restaurant: me.restaurant,
                },
                restaurant: me.restaurant ?? current.restaurant,
              }
            : current,
        );
      })
      .catch(() => {
        window.localStorage.removeItem(storageKey);
        setToken(undefined);
        setSession(undefined);
        setAuthToken(undefined);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    const data = await loginRequest(email, password).catch((error: unknown) => {
      throw normalizeApiError(error);
    });

    setToken(data.token);
    setSession(data);
    setAuthToken(data.token);
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function signOut() {
    setToken(undefined);
    setSession(undefined);
    setAuthToken(undefined);
    window.localStorage.removeItem(storageKey);
  }

  const value = useMemo(
    () => ({
      token,
      session,
      loading,
      signIn,
      signOut,
    }),
    [token, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
