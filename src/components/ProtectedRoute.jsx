import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      const fallback =
        user.role === "admin" ? "/admin" : user.role === "albat" ? "/albat" : "/user";
      return <Navigate to={fallback} replace />;
    }
  }
  return children;
}
