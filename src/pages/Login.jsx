import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg"
const API_BASE_URL = import.meta.env.VITE_API_BASE || "/api";
const REMEMBER_KEY = "hdc_crm_remember_email";

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      login(data.token, data.user);
      navigate(
        data.user.role === "admin" ? "/admin" : data.user.role === "albat" ? "/albat" : "/user",
        { replace: true }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleOAuthLogin(provider) {
    const returnTo = encodeURIComponent(window.location.origin + "/auth/callback");
    window.location.href = `${API_BASE_URL}/auth/${provider}?returnTo=${returnTo}`;
  }

  function handleForgotPassword() {
    setNotice("Нууц үг сэргээх функц одоогоор боломжгүй байна. Админтай холбогдоно уу.");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-left">
          <img src={logo} alt="Эрүүл мэндийн хөгжлийн төв" className="mark" />
          <div className="org-name">HDC CRM</div>
          <div className="tagline">Санал хүсэлтийн<br /> систем</div>
          <div className="subtagline">Харилцагчтай харилцах харилцааг удирдах систем</div>
        </div>

        <div className="auth-right">
          <h1>Системд нэвтрэх</h1>
          <p className="sub">Хүсэлт болон мэйл урсгалын системд нэвтэрнэ үү.</p>

          {error && <div className="error-box show">{error}</div>}
          {notice && <div className="success-box show">{notice}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="email">Имэйл хаяг</label>
              <div className="input-icon-wrap">
                <PersonIcon />
                <input
                  id="email"
                  type="email"
                  placeholder="you@hdc.gov.mn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="password">Нууц үг</label>
              <div className="input-icon-wrap">
                <LockIcon />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="remember-row">
              <label>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Энэ компьютерт сануулах
              </label>
              <button type="button" className="forgot-link" onClick={handleForgotPassword}>
                Нууц үгээ мартсан?
              </button>
            </div>

            <button type="submit" className="btn block" disabled={loading}>
              {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
            </button>
          </form>

          <div className="auth-divider">
            <span>эсвэл</span>
          </div>

          <style>{`
            .oauth-buttons {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .oauth-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              width: 100%;
              padding: 11px 16px;
              border-radius: 10px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
            }
            .oauth-btn.google {
              background: #fff;
              color: #3c4043;
              border: 1px solid #dadce0;
            }
            .oauth-btn.google:hover:not(:disabled) {
              background: #f8f9fa;
              box-shadow: 0 1px 2px rgba(0,0,0,0.08);
            }
            .oauth-btn.facebook {
              background: #1877F2;
              color: #fff;
              border: 1px solid #1877F2;
            }
            .oauth-btn.facebook:hover:not(:disabled) {
              background: #166fe0;
            }
            .oauth-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          `}</style>

          <div className="oauth-buttons">
            <button
              type="button"
              className="btn oauth-btn google"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
                <path fill="#FBBC05" d="M3.97 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.34z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              Google-ээр нэвтрэх
            </button>

            <button
              type="button"
              className="btn oauth-btn facebook"
              onClick={() => handleOAuthLogin("facebook")}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
              </svg>
              Facebook-ээр нэвтрэх
            </button>
          </div>

          <p className="auth-switch">
            Бүртгэлгүй юу? <Link to="/register">Бүртгүүлэх</Link>
          </p>
        </div>

        <div className="auth-footer">Copyright © 2026 HDC CRM</div>
      </div>
    </div>
  );
}
