import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import {
  type AuthSession,
  AUTH_STORAGE_KEY,
  fetchMe,
  loginRequest,
  logout,
  persistAuth,
  restoreAuth,
} from "../api/auth";
import { normalizeApiError } from "../api/helpers";
import { setAuthToken } from "../api/client";

type AuthContextValue = {
  token?: string;
  session: AuthSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  loading: true,
  signIn: async () => undefined,
  signOut: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restored = restoreAuth();

    if (!restored) {
      setLoading(false);
      return;
    }

    setToken(restored.token);
    setSession(restored);
    setAuthToken(restored.token);

    fetchMe()
      .then((snapshot) => {
        setSession((current) => {
          if (!current) {
            return current;
          }

          const nextSession: AuthSession = {
            token: current.token,
            user: snapshot.user,
            restaurant: snapshot.restaurant,
          };

          persistAuth(nextSession);
          return nextSession;
        });
      })
      .catch((error: unknown) => {
        const normalized = normalizeApiError(error);

        if (normalized.status === 401 || normalized.status === 403) {
          logout();
          setToken(undefined);
          setSession(null);
          setAuthToken(undefined);
          return;
        }

        const fallbackRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!fallbackRaw) {
          setToken(undefined);
          setSession(null);
          setAuthToken(undefined);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    const data = await loginRequest(email, password).catch((error: unknown) => {
      throw normalizeApiError(error);
    });

    setAuthToken(data.token);
    setToken(data.token);
    setSession(data);
    persistAuth(data);
  }

  function signOut() {
    setToken(undefined);
    setSession(null);
    logout();
  }

  const value = useMemo(
    () => ({
      token,
      session,
      isAuthenticated: Boolean(token && session),
      loading,
      signIn,
      signOut,
    }),
    [token, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
