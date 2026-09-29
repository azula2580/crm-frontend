import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg"

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

export default function Register() {
  const [role, setRole] = useState("user");
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", department_id: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/departments")
      .then((deps) => {
        setDepartments(deps);
        if (deps.length) setForm((f) => ({ ...f, department_id: String(deps[0].id) }));
      })
      .catch(() => setDepartments([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role
    };
    if (role === "albat") payload.department_id = Number(form.department_id);

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      login(data.token, data.user);
      setSuccess("Амжилттай бүртгэгдлээ. Шилжиж байна...");
      setTimeout(() => {
        navigate(data.user.role === "albat" ? "/albat" : "/user", { replace: true });
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-left">
          <img src={logo} alt="Эрүүл мэндийн хөгжлийн төв" className="mark" />
          <div className="org-name">HDC CRM</div>
          <div className="tagline">Санал хүсэлт<br />хариу барих систем</div>
          <div className="subtagline">Хүсэлт удирдлагын цахим систем</div>
        </div>

        <div className="auth-right">
          <h1>Шинэ бүртгэл</h1>
          <p className="sub">Хэрэглэгчийн төрлөө сонгож бүртгүүлнэ үү.</p>

          {error && <div className="error-box show">{error}</div>}
          {success && <div className="success-box show">{success}</div>}

          <div className="role-toggle">
            <button type="button" className={role === "user" ? "active" : ""} onClick={() => setRole("user")}>
              Энгийн хэрэглэгч
            </button>
            <button type="button" className={role === "albat" ? "active" : ""} onClick={() => setRole("albat")}>
              Алба
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name">Овог нэр</label>
              <div className="input-icon-wrap">
                <PersonIcon />
                <input
                  id="name"
                  type="text"
                  placeholder="Бат-Эрдэнэ"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="email">Имэйл хаяг</label>
              <div className="input-icon-wrap">
                <PersonIcon />
                <input
                  id="email"
                  type="email"
                  placeholder="you@hdc.gov.mn"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>

            {role === "albat" && (
              <div className="form-row">
                <label htmlFor="department">Харьяалагдах алба</label>
                <select
                  id="department"
                  value={form.department_id}
                  onChange={(e) => update("department_id", e.target.value)}
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <p className="hint" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Танд ирэх хүсэлтүүд энэ албаар шүүгдэнэ.
                </p>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="password">Нууц үг</label>
              <div className="input-icon-wrap">
                <LockIcon />
                <input
                  id="password"
                  type="password"
                  placeholder="Багадаа 6 тэмдэгт"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn block" disabled={loading}>
              {loading ? "Түр хүлээнэ үү..." : "Бүртгүүлэх"}
            </button>
          </form>

          <p className="auth-switch">
            Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
          </p>
        </div>

        <div className="auth-footer">Copyright © 2026 HDC CRM</div>
      </div>
    </div>
  );
}
