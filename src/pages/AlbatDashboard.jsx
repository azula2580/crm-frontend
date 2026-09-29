import { useState, useEffect, useMemo } from "react";
import { apiFetch, fmtDate, statusLabels, statusFlow } from "../api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import RequestConversation from "../components/Requestconversation";

// HTML-тэй агуулгаас (message/reply) зөвхөн текстийг гаргаж авна — хайлтад ашиглана.
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function AlbatDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusDraft, setStatusDraft] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [messageText, setMessageText] = useState("");

  async function loadRequests() {
    try {
      const data = await apiFetch("/requests");
      setRequests(data);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    }
  }

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Тайлбар болон төлөвийг нэг дор хадгална.
  async function handleSubmit() {
    const text = messageText.trim();
    const changed = !!statusDraft && statusDraft !== activeRequest.status;
    if (!text && !changed) return;

    setSaving(true);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const byStatus = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) => {
      const haystack = [
        r.subject,
        r.user_name,
        r.user_email,
        stripHtml(r.message),
        stripHtml(r.reply),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [byStatus, search]);

  function openRequest(r) {
    setSelectedId(r.id);
    setStatusDraft(r.status);
  }

  function closeModal() {
    setSelectedId(null);
    setStatusDraft(null);
    setMessageText("");
  }

  const activeRequest = requests.find((r) => r.id === selectedId) || null;
  const statusChanged = activeRequest && statusDraft && statusDraft !== activeRequest.status;
  const canSubmit = !!messageText.trim() || !!statusChanged;

  return (
    <>
      <Topbar subtitle={<>{user?.department_name}</>} />
      <div className="page-shell">
      <div className="wrap">
        <div className="section-head">
          <span className="accent-bar" />
          <span className="overline">Алба</span>
        </div>
        <h1 className="page-title" style={{ marginBottom: 16 }}>Ирсэн хүсэлтүүд</h1>

        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Гарчиг, илгээгч, агуулгаар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch("")}>
              Цэвэрлэх
            </button>
          )}
          <span className="count-pill">{filtered.length} хүсэлт</span>
        </div>

        {loadError && <div className="empty-state">Ачааллахад алдаа гарлаа: {loadError}</div>}

        {!loadError && filtered.length > 0 && (
          <div className="req-table-wrap">
            <table className="req-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Огноо</th>
                  <th>Илгээгч</th>
                  <th>Гарчиг</th>
                  <th>Эх сурвалж</th>
                  <th>Төлөв</th>
                  <th>Хавсралт</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} onClick={() => openRequest(r)} className="req-table-row">
                    <td>{i + 1}</td>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>
                      {r.user_name}
                      <div className="req-table-email">{r.user_email}</div>
                    </td>
                    <td>{r.subject}</td>
                    <td>{r.source === "email" ? "📧 Мэйл" : "🌐 Веб"}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.attachments && r.attachments.length > 0 ? (
                        <span className="attachment-count-chip">📎 {r.attachments.length}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadError && filtered.length === 0 && (
          <div className="empty-state">
            <div className="big">✅</div>
            <div>Энэ ангилалд хүсэлт алга.</div>
          </div>
        )}
      </div>
      </div>

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
            </aside>
          </div>
        </Modal>
      )}
    </>
  );
}