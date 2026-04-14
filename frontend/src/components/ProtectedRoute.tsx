import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated || !session?.user?.id || !session.restaurant?.id) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!["owner", "admin", "manager"].includes(session.user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
