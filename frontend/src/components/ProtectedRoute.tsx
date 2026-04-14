import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, token, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (
    session?.user?.role &&
    !["owner", "admin", "manager"].includes(session.user.role)
  ) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
