import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "./LoadingState";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <LoadingState />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
