const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Backend-ийн "/uploads/..." гэх мэт ХАРЬЦАНГУЙ замуудыг frontend-ийн
// өөрийн origin (жишээ нь localhost:5173) биш, backend-ийн origin
// (жишээ нь localhost:5000) руу чиглэсэн бүтэн URL болгож хөрвүүлнэ.
// Үүнгүйгээр "Хавсаргасан файл харах" линк дээр дарахад frontend
// сервер дээрээс 404 буцаадаг байсан.
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export function fileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}
export function getToken() {
  return localStorage.getItem("crm_token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("crm_user");
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(token, user) {
  localStorage.setItem("crm_token", token);
  localStorage.setItem("crm_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
}

export async function apiFetch(path, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = Object.assign(
    isFormData ? {} : { "Content-Type": "application/json" },
    options.headers || {}
  );
  // FormData илгээх үед Content-Type-г ГАРААР бүү тавь — browser өөрөө
  // "multipart/form-data; boundary=..." гэж зөв тавих ёстой. Хэрэв
  // options.headers дотроос хэн нэгэн Content-Type дамжуулсан бол устгана.
  if (isFormData) delete headers["Content-Type"];

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
  }
  if (res.status === 401) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Нэвтрэлт дууссан байна.");
  }
  if (!res.ok) {
    throw new Error((data && data.message) || "Алдаа гарлаа.");
  }
  return data;
}

export const statusLabels = {
  new: "Шинэ",
  received: "Хүлээн авсан",
  processing: "Боловсруулж байна",
  resolved: "Шийдвэрлэсэн",
  closed: "Хаагдсан"
};

export const statusFlow = ["new", "received", "processing", "resolved", "closed"];

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}