import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SuperadminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SUPERADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
