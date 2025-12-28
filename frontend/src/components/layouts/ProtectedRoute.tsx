import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    // default behavior is push into the history stack, we would like to replace it
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
