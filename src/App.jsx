import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AlbatDashboard from "./pages/AlbatDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthCallback from "./pages/Authcallback";
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to={user.role === "albat" ? "/albat" : "/user"} replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/footer" element={<Footer />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/user"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
            <Footer/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/albat"
        element={
          <ProtectedRoute role="albat">
            <AlbatDashboard />
            <Footer/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
            <Footer/>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}