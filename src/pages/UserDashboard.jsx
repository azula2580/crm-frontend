import { useState, useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials, Paragraph, Autoformat, PasteFromOffice,
  Bold, Italic, Underline, Strikethrough,
  Heading, FontSize, FontColor, FontBackgroundColor, FontFamily,
  BlockQuote, Link, List, Alignment,
  Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize,
  Base64UploadAdapter,
  Table, TableToolbar, TableCellProperties, TableColumnResize,
  HorizontalLine, Indent, IndentBlock,
  FindAndReplace, RemoveFormat,
  SpecialCharacters, SpecialCharactersEssentials,
  MediaEmbed, PageBreak,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { apiFetch, fmtDate, fileUrl } from "../api";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import RequestConversation from "../components/Requestconversation";

const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600 };
const errorTextStyle = { color: "#e53935", fontSize: 13, marginTop: 4 };

// Зөвшөөрөгдсөн хавсралтын төрөл/хэмжээ
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_FILE_TYPES = [
  "image/png", "image/jpeg", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const emptyForm = { department_id: "", subject: "", content: "" };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function UserDashboard() {
  const [departments, setDepartments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  async function loadDepartments() {
    try {
      const deps = await apiFetch("/departments");
      setDepartments(deps);
      if (deps.length) setForm((f) => ({ ...f, department_id: String(deps[0].id) }));
    } catch (err) {
      setDepartments([]);
    }
  }

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
    loadDepartments();
    loadRequests();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleFileChange(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // ижил файлыг дахин сонгоход ч onChange asuudal гарахгүй байхаар цэвэрлэнэ

    if (picked.length === 0) return;

    let combined = [...attachments];
    let fileError = "";

    for (const file of picked) {
      if (combined.length >= MAX_FILES) {
        fileError = `Дээд тал нь ${MAX_FILES} файл хавсаргаж болно.`;
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        fileError = `"${file.name}" файлын хэмжээ 10MB-с хэтэрсэн байна.`;
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        fileError = `"${file.name}" төрлийн файлыг хавсаргах боломжгүй.`;
        continue;
      }
      const isDuplicate = combined.some((f) => f.name === file.name && f.size === file.size);
      if (isDuplicate) continue;
      combined.push(file);
    }

    setAttachments(combined);
    setErrors((prev) => ({ ...prev, attachment: fileError }));
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAttachments() {
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate() {
    const next = {};
    if (!form.department_id) next.department_id = "Алба сонгоно уу.";
    if (!form.subject.trim()) next.subject = "Гарчиг оруулна уу.";
    const plain = form.content.replace(/<[^>]*>/g, "").trim();
    if (!plain) next.content = "Агуулга оруулна уу.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function openCreateModal() {
    setError("");
    setSuccess("");
    setForm((f) => ({ ...emptyForm, department_id: f.department_id || (departments[0] ? String(departments[0].id) : "") }));
    clearAttachments();
    setErrors({});
    setShowCreate(true);
  }

  function closeCreateModal() {
    setShowCreate(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validate()) return;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("department_id", String(Number(form.department_id)));
      fd.append("subject", form.subject.trim());
      fd.append("message", form.content);
      attachments.forEach((file) => fd.append("attachments", file));

      await apiFetch("/requests", {
        method: "POST",
        body: fd,
      });

      loadRequests();
      setShowCreate(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openRequest(id) {
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);
  }

  async function handleSendMessage(text) {
    const res = await apiFetch(`/requests/${selectedId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: text }),
    });
    setRequests((prev) => prev.map((r) => (r.id === selectedId ? res.request : r)));
  }

  const activeRequest = requests.find((r) => r.id === selectedId) || null;

  return (
    <>
      <Topbar subtitle="энгийн хэрэглэгч" />
      <div className="page-shell">
      <div className="wrap">
        <div className="section-head">
          <span className="accent-bar" />
          <span className="overline">Хэрэглэгч</span>
        </div>

        <div className="list-head" style={{ marginTop: 4, alignItems: "flex-start" }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Миний хүсэлтүүд</h1>
          <button type="button" className="btn" style={{ width: "auto" }} onClick={openCreateModal}>
            + Шинэ хүсэлт үүсгэх
          </button>
        </div>

        {loadError && <div className="empty-state">Ачааллахад алдаа гарлаа: {loadError}</div>}

        {!loadError && requests.length === 0 && (
          <div className="empty-state">
            <div className="big">📭</div>
            <div>Та одоогоор хүсэлт илгээгээгүй байна.</div>
          </div>
        )}

        {requests.length > 0 && (
          <div className="req-table-wrap">
            <table className="req-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Огноо</th>
                  <th>Алба</th>
                  <th>Гарчиг</th>
                  <th>Төлөв</th>
                  <th>Хавсралт</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id} onClick={() => openRequest(r.id)} className="req-table-row">
                    <td>{i + 1}</td>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{r.department_name}</td>
                    <td>{r.subject}</td>
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
      </div>
      </div>

      {/* Хүсэлтийн дэлгэрэнгүй харах Modal */}
      {activeRequest && (
        <Modal
          title={activeRequest.subject}
          badge={<StatusBadge status={activeRequest.status} />}
          onClose={closeDetail}
          width={680}
        >
          <RequestConversation
            request={activeRequest}
            onSend={handleSendMessage}
            placeholder="Хариу таны асуудлыг шийдээгүй бол энд нэмэлт мессеж бичээрэй..."
          />
        </Modal>
      )}

      {/* Шинэ хүсэлт үүсгэх Modal */}
      {showCreate && (
        <Modal title="Шинэ хүсэлт үүсгэх" onClose={closeCreateModal} width={760}>
          {error && <div className="error-box show">{error}</div>}
          {success && <div className="success-box show">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="department">Алба</label>
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
              {errors.department_id && <p style={errorTextStyle}>{errors.department_id}</p>}
            </div>

            <div className="form-row">
              <label htmlFor="subject">Гарчиг</label>
              <input
                id="subject"
                type="text"
                placeholder="Жишээ: Хэвлэгч ажиллахгүй байна"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                required
              />
              {errors.subject && <p style={errorTextStyle}>{errors.subject}</p>}
            </div>

            <div className="form-row">
              <label style={labelStyle}>Агуулга *</label>
              <style>{`
                .content-editor-wrap .ck-editor__editable_inline {
                  min-height: 240px;
                }
              `}</style>
              <div
                className="content-editor-wrap"
                style={errors.content ? { border: "1px solid #e53935", borderRadius: 8 } : {}}
              >
                <CKEditor
                  editor={ClassicEditor}
                  config={{
                    licenseKey: "GPL",
                    plugins: [
                      Essentials, Paragraph, Autoformat, PasteFromOffice,
                      Bold, Italic, Underline, Strikethrough,
                      Heading, FontSize, FontColor, FontBackgroundColor, FontFamily,
                      BlockQuote, Link, List, Alignment,
                      Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize,
                      Base64UploadAdapter,
                      Table, TableToolbar, TableCellProperties, TableColumnResize,
                      HorizontalLine, Indent, IndentBlock,
                      FindAndReplace, RemoveFormat,
                      SpecialCharacters, SpecialCharactersEssentials,
                      MediaEmbed, PageBreak,
                    ],
                    toolbar: [
                      "heading", "|",
                      "bold", "italic", "underline", "strikethrough", "|",
                      "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "|",
                      "alignment", "|",
                      "bulletedList", "numberedList", "|",
                      "outdent", "indent", "|",
                      "link", "insertImage", "insertTable", "blockQuote",
                      "mediaEmbed", "horizontalLine", "pageBreak", "|",
                      "findAndReplace", "removeFormat", "|",
                      "undo", "redo",
                    ],
                    image: {
                      toolbar: [
                        "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|",
                        "toggleImageCaption", "imageTextAlternative",
                      ],
                    },
                    table: {
                      contentToolbar: [
                        "tableColumn", "tableRow", "mergeTableCells",
                        "tableProperties", "tableCellProperties",
                      ],
                    },
                    placeholder: "Санал хүсэлтийн дэлгэрэнгүйг энд бичнэ үү",
                  }}
                  data={form.content}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    setForm((prev) => ({ ...prev, content: data }));
                    setErrors((prev) => ({ ...prev, content: "" }));
                  }}
                />
              </div>
              {errors.content && <p style={errorTextStyle}>{errors.content}</p>}
            </div>

            <div className="form-row">
              <label style={labelStyle} htmlFor="attachment">
                Файл хавсаргах {attachments.length > 0 && `(${attachments.length}/${MAX_FILES})`}
              </label>
              <input
                id="attachment"
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                disabled={attachments.length >= MAX_FILES}
              />
              {attachments.length > 0 && (
                <div className="picked-file-list">
                  {attachments.map((file, i) => (
                    <div key={`${file.name}-${file.size}-${i}`} className="picked-file-row">
                      <span className="picked-file-name" title={file.name}>📎 {file.name}</span>
                      <span className="picked-file-size">{formatSize(file.size)}</span>
                      <button
                        type="button"
                        className="picked-file-remove"
                        onClick={() => removeAttachment(i)}
                        aria-label="Файл хасах"
                      >
                        Устгах
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Зөвшөөрөгдөх төрөл: зураг, PDF, Word, Excel. Ганц файл дээд хэмжээ 10MB, нийт дээд тал нь {MAX_FILES} файл.
              </p>
              {errors.attachment && <p style={errorTextStyle}>{errors.attachment}</p>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn secondary" onClick={closeCreateModal}>
                Цуцлах
              </button>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Илгээж байна..." : "Хүсэлт илгээх"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}