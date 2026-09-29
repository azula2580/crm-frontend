import { statusLabels } from "../api";

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{statusLabels[status] || status}</span>;
}
