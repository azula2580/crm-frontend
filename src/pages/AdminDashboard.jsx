import { useState, useEffect, useMemo, Fragment } from "react";
import { apiFetch, fmtDate, statusLabels, statusFlow } from "../api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import RequestConversation from "../components/Requestconversation";

const roleLabels = { user: "Хэрэглэгч", albat: "Алба", admin: "Админ" };

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");

  return (
    <>
      <Topbar subtitle="Системийн администратор" />
      <div className="page-shell">
      <div className="wrap">
        <div className="section-head">
          <span className="accent-bar" />
          <span className="overline">Систем</span>
        </div>
        <h1 className="page-title" style={{ marginBottom: 16 }}>Админ удирдлага</h1>

        <div className="tabs">
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
            Хэрэглэгчид
          </button>
          <button
            className={tab === "departments" ? "active" : ""}
            onClick={() => setTab("departments")}
          >
            Албад
          </button>
          <button
            className={tab === "requests" ? "active" : ""}
            onClick={() => setTab("requests")}
          >
            Хүсэлтүүд
          </button>
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "departments" && <DepartmentsTab />}
        {tab === "requests" && <RequestsTab />}
      </div>
    </div>
    </>
  );
}

/* ----------------------------- USERS TAB ----------------------------- */

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const [u, d] = await Promise.all([apiFetch("/users"), apiFetch("/departments")]);
      setUsers(u);
      setDepartments(d);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, roleLabels[u.role], u.department_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  async function toggleActive(u) {
    setBusyId(u.id);
    setMsg("");
    setErr("");
    try {
      const path = u.is_active ? `/users/${u.id}/deactivate` : `/users/${u.id}/activate`;
      const data = await apiFetch(path, { method: "PATCH" });
      setMsg(data.message);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Нэр, имэйл, эрх, албаар хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="count-pill">{filtered.length} хэрэглэгч</span>
        <button className="btn" style={{ width: "auto" }} onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Хаах" : "+ Шинэ хэрэглэгч"}
        </button>
      </div>

      {msg && <div className="success-box show">{msg}</div>}
      {err && <div className="error-box show">{err}</div>}

      {showCreate && (
        <CreateUserForm
          departments={departments}
          onDone={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {loading && <div className="empty-state">Ачааллаж байна...</div>}
      {loadError && <div className="empty-state">Алдаа: {loadError}</div>}

      {!loading && !loadError && (
        <div className="req-table-wrap">
          <table className="req-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Нэр</th>
                <th>Имэйл</th>
                <th>Эрх</th>
                <th>Алба</th>
                <th>Төлөв</th>
                <th>Бүртгүүлсэн</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <Fragment key={u.id}>
                  <tr>
                    <td>{i + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{roleLabels[u.role] || u.role}</td>
                    <td>{u.department_name || "—"}</td>
                    <td>
                      <span className={`badge ${u.is_active ? "done" : "rejected"}`}>
                        {u.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                    </td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                      <button
                        className="search-clear"
                        onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                      >
                        Засах
                      </button>
                      <button
                        className="search-clear"
                        disabled={busyId === u.id}
                        onClick={() => toggleActive(u)}
                      >
                        {busyId === u.id
                          ? "..."
                          : u.is_active
                          ? "Идэвхгүй болгох"
                          : "Идэвхжүүлэх"}
                      </button>
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr>
                      <td colSpan={8} style={{ background: "#f9fafc" }}>
                        <EditUserForm
                          targetUser={u}
                          departments={departments}
                          onCancel={() => setEditingId(null)}
                          onDone={() => {
                            setEditingId(null);
                            load();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Хэрэглэгч олдсонгүй.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateUserForm({ departments, onDone }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.role !== "albat") delete payload.department_id;
      else payload.department_id = Number(payload.department_id);
      await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h3 style={{ marginTop: 0 }}>Шинэ хэрэглэгч</h3>
      {err && <div className="error-box show">{err}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Нэр</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="form-row">
          <label>Имэйл</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-row">
          <label>Нууц үг</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <div className="form-row">
          <label>Эрх</label>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="user">Хэрэглэгч</option>
            <option value="albat">Алба</option>
            <option value="admin">Админ</option>
          </select>
        </div>
        {form.role === "albat" && (
          <div className="form-row">
            <label>Алба</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
              required
            >
              <option value="">-- сонгох --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button className="btn" disabled={saving}>
          {saving ? "Үүсгэж байна..." : "Үүсгэх"}
        </button>
      </form>
    </div>
  );
}

function EditUserForm({ targetUser, departments, onCancel, onDone }) {
  const [form, setForm] = useState({
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    department_id: targetUser.department_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const payload = { ...form };
      payload.department_id = payload.role === "albat" ? Number(payload.department_id) || null : null;
      await apiFetch(`/users/${targetUser.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      {err && <div className="error-box show" style={{ width: "100%" }}>{err}</div>}
      <div className="form-row" style={{ marginBottom: 0 }}>
        <label>Нэр</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="form-row" style={{ marginBottom: 0 }}>
        <label>Имэйл</label>
        <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      </div>
      <div className="form-row" style={{ marginBottom: 0 }}>
        <label>Эрх</label>
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          <option value="user">Хэрэглэгч</option>
          <option value="albat">Алба</option>
          <option value="admin">Админ</option>
        </select>
      </div>
      {form.role === "albat" && (
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Алба</label>
          <select
            value={form.department_id}
            onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
          >
            <option value="">-- сонгох --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button className="btn" style={{ width: "auto" }} disabled={saving}>
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </button>
      <button type="button" className="search-clear" onClick={onCancel}>
        Цуцлах
      </button>
    </form>
  );
}

/* --------------------------- DEPARTMENTS TAB --------------------------- */

function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imapEditingId, setImapEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const d = await apiFetch("/departments");
      setDepartments(d);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(dep) {
    if (!window.confirm(`"${dep.name}" албыг устгахдаа итгэлтэй байна уу?`)) return;
    setBusyId(dep.id);
    setMsg("");
    setErr("");
    try {
      const data = await apiFetch(`/departments/${dep.id}`, { method: "DELETE" });
      setMsg(data.message);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="search-row">
        <span className="count-pill">{departments.length} алба</span>
        <button className="btn" style={{ width: "auto" }} onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Хаах" : "+ Шинэ алба"}
        </button>
      </div>

      {msg && <div className="success-box show">{msg}</div>}
      {err && <div className="error-box show">{err}</div>}

      {showCreate && (
        <DepartmentForm
          onDone={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {loading && <div className="empty-state">Ачааллаж байна...</div>}
      {loadError && <div className="empty-state">Алдаа: {loadError}</div>}

      {!loading && !loadError && (
        <div className="req-table-wrap">
          <table className="req-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Нэр</th>
                <th>Тайлбар</th>
                <th>Мэдэгдлийн мэйл</th>
                <th>IMAP</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <Fragment key={d.id}>
                  <tr>
                    <td>{i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.description || "—"}</td>
                    <td>{d.email || "—"}</td>
                    <td>{d.imap_enabled ? "✅ Идэвхтэй" : "—"}</td>
                    <td style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                      <button
                        className="search-clear"
                        onClick={() => {
                          setImapEditingId(null);
                          setEditingId(editingId === d.id ? null : d.id);
                        }}
                      >
                        Засах
                      </button>
                      <button
                        className="search-clear"
                        onClick={() => {
                          setEditingId(null);
                          setImapEditingId(imapEditingId === d.id ? null : d.id);
                        }}
                      >
                        ✉️ IMAP
                      </button>
                      <button
                        className="search-clear"
                        disabled={busyId === d.id}
                        onClick={() => remove(d)}
                      >
                        {busyId === d.id ? "..." : "Устгах"}
                      </button>
                    </td>
                  </tr>
                  {editingId === d.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "#f9fafc" }}>
                        <DepartmentForm
                          existing={d}
                          onCancel={() => setEditingId(null)}
                          onDone={() => {
                            setEditingId(null);
                            load();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                  {imapEditingId === d.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "#f9fafc" }}>
                        <DepartmentImapForm
                          department={d}
                          onCancel={() => setImapEditingId(null)}
                          onDone={() => {
                            setImapEditingId(null);
                            load();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Алба алга.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DepartmentForm({ existing, onCancel, onDone }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    description: existing?.description || "",
    email: existing?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      if (existing) {
        await apiFetch(`/departments/${existing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await apiFetch("/departments", { method: "POST", body: JSON.stringify(form) });
      }
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={existing ? "" : "card"}
      style={existing ? { padding: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } : { maxWidth: 480 }}
    >
      {!existing && <h3 style={{ marginTop: 0 }}>Шинэ алба</h3>}
      {err && <div className="error-box show" style={{ width: "100%" }}>{err}</div>}
      <div className="form-row" style={existing ? { marginBottom: 0 } : {}}>
        <label>Нэр</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="form-row" style={existing ? { marginBottom: 0 } : {}}>
        <label>Тайлбар</label>
        <input
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="form-row" style={existing ? { marginBottom: 0 } : {}}>
        <label>Мэдэгдлийн мэйл</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <button className="btn" style={existing ? { width: "auto" } : {}} disabled={saving}>
        {saving ? "Хадгалж байна..." : existing ? "Хадгалах" : "Үүсгэх"}
      </button>
      {existing && (
        <button type="button" className="search-clear" onClick={onCancel}>
          Цуцлах
        </button>
      )}
    </form>
  );
}

/* --- Гадны мэйл автоматаар хүсэлт болгох (IMAP intake) тохиргоо — зөвхөн admin --- */
function DepartmentImapForm({ department, onCancel, onDone }) {
  const [form, setForm] = useState({
    imap_enabled: false,
    imap_host: "",
    imap_port: 993,
    imap_secure: true,
    imap_user: "",
    imap_password: "",
  });
  const [passwordSet, setPasswordSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/departments/${department.id}/imap`);
        if (data) {
          setForm({
            imap_enabled: !!data.imap_enabled,
            imap_host: data.imap_host || "",
            imap_port: data.imap_port || 993,
            imap_secure: data.imap_secure !== false,
            imap_user: data.imap_user || "",
            imap_password: "",
          });
          setPasswordSet(!!data.imap_password_set);
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department.id]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setSaving(true);
    try {
      const payload = { ...form, imap_port: Number(form.imap_port) || 993 };
      if (!payload.imap_password) delete payload.imap_password; // хоосон бол хуучин нууц үгийг хэвээр үлдээнэ
      const data = await apiFetch(`/departments/${department.id}/imap`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMsg(data.message || "Хадгалагдлаа.");
      setPasswordSet(!!data.department?.imap_password_set);
      setForm((f) => ({ ...f, imap_password: "" }));
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 12 }}>Ачааллаж байна...</div>;

  return (
    <div style={{ padding: 12, maxWidth: 480 }}>
      <h3 style={{ marginTop: 0 }}>
        "{department.name}" — гадны мэйл автоматаар хүсэлт болгох тохиргоо
      </h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Энд оруулсан мэйл хайрцгийн (IMAP) мэдээллийг ашиглан систем 2 минут тутам
        шинэ (уншаагүй) мэйлийг шалгаж, автоматаар "хүсэлт" болгож жагсаалтад нэмнэ.
      </p>
      {msg && <div className="success-box show">{msg}</div>}
      {err && <div className="error-box show">{err}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.imap_enabled}
              onChange={(e) => setForm((f) => ({ ...f, imap_enabled: e.target.checked }))}
            />
            Идэвхжүүлэх
          </label>
        </div>
        <div className="form-row">
          <label>IMAP хаяг (host)</label>
          <input
            type="text"
            placeholder="mail.gov.mn"
            value={form.imap_host}
            onChange={(e) => setForm((f) => ({ ...f, imap_host: e.target.value }))}
          />
        </div>
        <div className="form-row" style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Порт</label>
            <input
              type="number"
              value={form.imap_port}
              onChange={(e) => setForm((f) => ({ ...f, imap_port: e.target.value }))}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input
              type="checkbox"
              checked={form.imap_secure}
              onChange={(e) => setForm((f) => ({ ...f, imap_secure: e.target.checked }))}
            />
            TLS/SSL (secure)
          </label>
        </div>
        <div className="form-row">
          <label>Мэйл хаяг</label>
          <input
            type="email"
            placeholder="test2@hdc.gov.mn"
            value={form.imap_user}
            onChange={(e) => setForm((f) => ({ ...f, imap_user: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>
            Нууц үг{" "}
            {passwordSet && (
              <span className="hint">(хадгалагдсан — солихыг хүсвэл шинээр бичнэ үү)</span>
            )}
          </label>
          <input
            type="password"
            placeholder={passwordSet ? "••••••••" : ""}
            value={form.imap_password}
            onChange={(e) => setForm((f) => ({ ...f, imap_password: e.target.value }))}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn" style={{ width: "auto" }} disabled={saving}>
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
          <button type="button" className="search-clear" onClick={onCancel}>
            Хаах
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------- REQUESTS TAB ---------------------------- */

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Дэлгэрэнгүй/засварлах Modal
  const [selectedId, setSelectedId] = useState(null);
  const [statusDraft, setStatusDraft] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [transferDept, setTransferDept] = useState("");
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const [r, d] = await Promise.all([apiFetch("/requests"), apiFetch("/departments")]);
      setRequests(r);
      setDepartments(d);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byStatus = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) =>
      [r.subject, r.user_name, r.user_email, r.department_name, stripHtml(r.message)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [byStatus, search]);

  function departmentIdOf(r) {
    if (!r) return "";
    if (r.department_id) return String(r.department_id);
    const match = departments.find((d) => d.name === r.department_name);
    return match ? String(match.id) : "";
  }

  function openRequest(r) {
    setSelectedId(r.id);
    setStatusDraft(r.status);
    setTransferDept(departmentIdOf(r));
    setMsg("");
    setErr("");
  }

  function closeModal() {
    setSelectedId(null);
    setStatusDraft(null);
    setMessageText("");
    setTransferDept("");
  }

  // Тайлбар болон төлөвийг нэг дор хадгална.
  async function handleSubmit() {
    const text = messageText.trim();
    const changed = !!statusDraft && statusDraft !== activeRequest.status;
    if (!text && !changed) return;

    setSaving(true);
    setErr("");
    try {
      const data = await apiFetch(`/requests/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: text,
          status: changed ? statusDraft : undefined,
        }),
      });
      setRequests((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...data.request } : r)));
      setMessageText("");
      setMsg("Илгээгдлээ.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Хэрэглэгч алба буруу сонгосон тохиолдолд хүсэлтийг зөв алба руу шилжүүлнэ.
  async function handleTransfer(id) {
    if (!transferDept) return;
    setTransferring(true);
    setErr("");
    try {
      const data = await apiFetch(`/requests/${id}/department`, {
        method: "PATCH",
        body: JSON.stringify({ department_id: Number(transferDept) }),
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.request } : r)));
      setMsg(data.message || "Хүсэлтийг өөр албанд шилжүүллээ.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setTransferring(false);
    }
  }

  async function remove(r) {
    if (!window.confirm(`"${r.subject}" хүсэлтийг устгахдаа итгэлтэй байна уу?`)) return;
    setBusyId(r.id);
    setMsg("");
    setErr("");
    try {
      const data = await apiFetch(`/requests/${r.id}`, { method: "DELETE" });
      setMsg(data.message);
      if (selectedId === r.id) closeModal();
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const activeRequest = requests.find((r) => r.id === selectedId) || null;
  const statusChanged = activeRequest && statusDraft && statusDraft !== activeRequest.status;
  const canSubmit = !!messageText.trim() || !!statusChanged;
  const activeDeptId = departmentIdOf(activeRequest);
  const deptChanged = activeRequest && transferDept && String(transferDept) !== activeDeptId;

  return (
    <div>

      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Гарчиг, илгээгч, алба, агуулгаар хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="count-pill">{filtered.length} хүсэлт</span>
      </div>

      {msg && <div className="success-box show">{msg}</div>}
      {err && <div className="error-box show">{err}</div>}
      {loading && <div className="empty-state">Ачааллаж байна...</div>}
      {loadError && <div className="empty-state">Алдаа: {loadError}</div>}

      {!loading && !loadError && (
        <div className="req-table-wrap">
          <table className="req-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Огноо</th>
                <th>Илгээгч</th>
                <th>Алба</th>
                <th>Гарчиг</th>
                <th>Эх сурвалж</th>
                <th>Төлөв</th>
                <th>Хавсралт</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="req-table-row" onClick={() => openRequest(r)}>
                  <td>{i + 1}</td>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>
                    {r.user_name}
                    <div className="req-table-email">{r.user_email}</div>
                  </td>
                  <td>{r.department_name}</td>
                  <td>{r.subject}</td>
                  <td>{r.source === "email" ? "📧 Мэйл" : "🌐 Веб"}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.attachments && r.attachments.length > 0 ? (
                      <span className="attachment-count-chip">
                        📎 {r.attachments.length}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      className="search-clear"
                      disabled={busyId === r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(r);
                      }}
                    >
                      {busyId === r.id ? "..." : "Устгах"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Хүсэлт олдсонгүй.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeRequest && (
        <Modal
          title={activeRequest.subject}
          badge={<StatusBadge status={activeRequest.status} />}
          onClose={closeModal}
          width={900}
        >
          <div className="req-layout">
            <div className="req-main">
              <RequestConversation
                request={activeRequest}
                value={messageText}
                onChange={setMessageText}
                hideSend
                placeholder="Хэрэглэгч рүү тайлбар бичих..."
              />

              {err && <div className="error-box show">{err}</div>}
              {msg && <div className="success-box show">{msg}</div>}

              <div className="req-actions">
                <button
                  type="button"
                  className="btn"
                  style={{ width: "auto" }}
                  disabled={saving || !canSubmit}
                  onClick={handleSubmit}
                >
                  {saving ? "Илгээж байна..." : "Илгээх"}
                </button>
              </div>
            </div>

            <aside className="req-side">
              <h4>Төлөв</h4>
              <select
                value={statusDraft || activeRequest.status}
                onChange={(e) => setStatusDraft(e.target.value)}
              >
                {statusFlow.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
              {statusChanged && (
                <p className="hint">
                  "Илгээх" дарахад төлөв <b>{statusLabels[statusDraft]}</b> болж, хэрэглэгчид имэйл очно.
                </p>
              )}

              <h4>Алба</h4>
              <select value={transferDept} onChange={(e) => setTransferDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {deptChanged && (
                <button
                  type="button"
                  className="btn secondary"
                  style={{ width: "100%", marginBottom: 14 }}
                  disabled={transferring}
                  onClick={() => handleTransfer(activeRequest.id)}
                >
                  {transferring ? "Шилжүүлж байна..." : "Албанд шилжүүлэх"}
                </button>
              )}

              <button
                type="button"
                className="req-side-danger"
                disabled={busyId === activeRequest.id}
                onClick={() => remove(activeRequest)}
              >
                {busyId === activeRequest.id ? "..." : "Хүсэлтийг устгах"}
              </button>
            </aside>
          </div>
        </Modal>
      )}
    </div>
  );
}