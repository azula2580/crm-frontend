import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError("Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.");
      return;
    }

    if (!token || !userParam) {
      setError("Нэвтрэлтийн мэдээлэл дутуу байна.");
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      login(token, user);
      navigate(
        user.role === "admin" ? "/admin" : user.role === "albat" ? "/albat" : "/user",
        { replace: true }
      );
    } catch (err) {
      setError("Нэвтрэлтийн мэдээллийг уншиж чадсангүй.");
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        {error ? (
          <>
            <p className="error-box show">{error}</p>
            <button className="btn" onClick={() => navigate("/login")}>
              Нэвтрэх хуудас руу буцах
            </button>
          </>
        ) : (
          <p>Нэвтэрч байна...</p>
        )}
      </div>
    </div>
  );
}