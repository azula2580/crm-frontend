import { useState } from "react";
import { fmtDate, fileUrl } from "../api";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function extOf(name = "") {
  const m = String(name).match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "file";
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function Msg({ staff, name, time, children }) {
  return (
    <div className="conv-msg">
      <div className={`conv-av ${staff ? "staff" : "user"}`}>{staff ? "АЛ" : initials(name)}</div>
      <div className="conv-body">
        <div className="conv-head">
          <b>{staff ? "Алба" : name || "Хэрэглэгч"}</b>
          {time && <span>{fmtDate(time)}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Хүсэлтийн бүх харилцааг нэг урсгалаар харуулна:
 * анхны хүсэлт (+ хавсралт) → анхны хариу → нэмэлт мессежүүд → бичих талбар.
 *
 * - value/onChange өгвөл бичих талбарын утгыг эцэг компонент эзэмшинэ.
 * - hideSend өгвөл өөрийн "Илгээх" товч харагдахгүй (эцэг нь илгээнэ).
 * - onSend(text) өгвөл (hideSend-гүй үед) өөрийн товчоор илгээнэ.
 */
export default function RequestConversation({
  request,
  value,
  onChange,
  onSend,
  hideSend = false,
  placeholder = "Мессеж бичих...",
}) {
  const [inner, setInner] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const controlled = value !== undefined;
  const text = controlled ? value : inner;
  const setText = controlled ? onChange : setInner;

  const attachments = request.attachments || [];
  const thread = request.messages || [];

  async function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !onSend) return;
    setSending(true);
    setErr("");
    try {
      await onSend(trimmed);
      setText("");
    } catch (e2) {
      setErr(e2.message || "Илгээхэд алдаа гарлаа.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="conv">
      <div className="conv-list">
        <div className="conv-content">
          <div className="conv-text" dangerouslySetInnerHTML={{ __html: request.message }} />
          {attachments.length > 0 && (
            <div className="conv-files">
              {attachments.map((a) => {
                const name = a.original_name || a.filename || "Файл";
                const size = formatSize(a.size);
                return (
                  <a
                    key={a.id ?? a.filename}
                    className="conv-chip"
                    href={fileUrl(a.url || `/uploads/${a.filename}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={name}
                  >
                    <span className="conv-chip-ext">{extOf(name).slice(0, 4).toUpperCase()}</span>
                    <span className="conv-chip-name">{name}</span>
                    {size && <span className="conv-chip-size">{size}</span>}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {request.reply && (
          <Msg staff>
            <div className="conv-bubble staff">
              <div className="conv-text" dangerouslySetInnerHTML={{ __html: request.reply }} />
            </div>
          </Msg>
        )}

        {thread.map((m) => {
          const staff = m.sender_role === "albat";
          return (
            <Msg key={m.id} staff={staff} name={m.sender_name} time={m.created_at}>
              <div className={`conv-bubble ${staff ? "staff" : ""}`}>
                <div className="conv-text conv-plain">{m.body}</div>
              </div>
            </Msg>
          );
        })}
      </div>

      <form className="conv-form" onSubmit={submit}>
        <textarea
          rows={3}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {!hideSend && (
          <div className="conv-form-foot">
            {err && <span className="conv-err">{err}</span>}
            <button type="submit" className="btn" style={{ width: "auto" }} disabled={sending || !text.trim()}>
              {sending ? "Илгээж байна..." : "Илгээх"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}