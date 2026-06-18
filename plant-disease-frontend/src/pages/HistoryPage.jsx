// pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SEVERITY_CONFIG = {
  None:    { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "✅", label: "Healthy" },
  Low:     { text: "#ca8a04", bg: "#fefce8", border: "#fde047", icon: "🟡", label: "Low Risk" },
  Medium:  { text: "#ea580c", bg: "#fff7ed", border: "#fdba74", icon: "⚠️", label: "Medium" },
  High:    { text: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "🚨", label: "High Risk" },
  Unknown: { text: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "❓", label: "Unknown" },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return "Unknown date"; }
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function HistoryDetailModal({ item, onClose, onDelete }) {
  const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.Unknown;
  const navigate = useNavigate();

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={M.header}>
          <div style={{ ...M.sevBadge, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>
            {sev.icon} {sev.label}
          </div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Image */}
        <img src={item.preview} alt="leaf" style={M.img} />

        {/* Disease name */}
        <div style={M.diseaseName}>{item.disease}</div>
        <div style={M.dateText}>{formatDate(item.timestamp)}</div>

        {/* Confidence bar */}
        <div style={M.confRow}>
          <span style={M.confLabel}>Confidence</span>
          <span style={{ ...M.confVal, color: item.confidence > 80 ? "#16a34a" : item.confidence > 60 ? "#ca8a04" : "#ef4444" }}>
            {item.confidence}%
          </span>
        </div>
        <div style={M.confBarBg}>
          <div style={{
            ...M.confBarFill,
            width: `${item.confidence}%`,
            background: item.confidence > 80 ? "#16a34a" : item.confidence > 60 ? "#ca8a04" : "#ef4444"
          }} />
        </div>

        {/* Actions */}
        <div style={M.btnRow}>
          <button style={M.scanAgainBtn} onClick={() => { onClose(); navigate("/diagnose"); }}>
            🔬 Scan Again
          </button>
          <button style={M.deleteBtn} onClick={() => onDelete(item.id)}>
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const M = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: 20 },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" },
  sevBadge: { borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 },
  closeBtn: { background: "#f9fafb", border: "1px solid #e5e7eb", color: "#6b7280", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 },
  img: { width: "100%", height: 220, objectFit: "cover", display: "block" },
  diseaseName: { fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", padding: "16px 20px 4px" },
  dateText: { fontSize: 12, color: "#9ca3af", padding: "0 20px 14px" },
  confRow: { display: "flex", justifyContent: "space-between", padding: "0 20px 6px" },
  confLabel: { fontSize: 13, color: "#6b7280" },
  confVal: { fontSize: 14, fontWeight: 700 },
  confBarBg: { margin: "0 20px 16px", height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: 4, transition: "width 0.8s ease" },
  btnRow: { display: "flex", gap: 10, padding: "0 20px 20px" },
  scanAgainBtn: { flex: 1, padding: "11px", background: "#16a34a", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  deleteBtn: { padding: "11px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [history, setHistory]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [filterSev, setFilterSev]   = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leafdoc_history") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("leafdoc_history");
    setSelected(null);
  };

  const exportCSV = () => {
    const headers = ["Date", "Disease", "Confidence (%)", "Severity", "Is Healthy"];
    const rows = history.map(item => [
      new Date(item.timestamp).toLocaleString("en-IN"),
      item.disease,
      item.confidence,
      item.severity,
      item.isHealthy ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `leafdoc_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteItem = (id) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem("leafdoc_history", JSON.stringify(updated));
    setSelected(null);
  };

  // Filter logic
  const filtered = history.filter(item => {
    const matchSearch = item.disease.toLowerCase().includes(search.toLowerCase());
    const matchSev    = filterSev === "All" || item.severity === filterSev;
    return matchSearch && matchSev;
  });

  const severities = ["All", "High", "Medium", "Low", "None"];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 12 }}>
            🕐 Scan History
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,36px)", fontWeight: 800, color: "#111827" }}>
            Your Previous Scans
          </h1>
        </div>
        {history.length > 0 && (
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={exportCSV} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
              📥 Export CSV
            </button>
            <button onClick={clearHistory} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
              🗑️ Clear All
            </button>
          </div>
        )}
      </div>

      {/* Search + Filter bar */}
      {history.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#fff", color: "#111827" }}
            placeholder="🔍 Search by disease name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {severities.map(s => {
              const sev = SEVERITY_CONFIG[s];
              const isActive = filterSev === s;
              return (
                <button key={s} onClick={() => setFilterSev(s)}
                  style={{
                    padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    border: isActive ? `1px solid ${sev?.border || "#bbf7d0"}` : "1px solid #e5e7eb",
                    background: isActive ? (sev?.bg || "#f0fdf4") : "#fff",
                    color: isActive ? (sev?.text || "#16a34a") : "#6b7280",
                  }}>
                  {s === "All" ? "All" : `${sev?.icon} ${s}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8 }}>No scans yet</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Upload a leaf image to get started</div>
          <button onClick={() => navigate("/diagnose")} style={{ background: "#16a34a", border: "none", color: "#fff", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            🔬 Start Diagnosing
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No results found</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Try a different search or filter</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
            Showing {filtered.length} of {history.length} scan{history.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map(item => {
              const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.Unknown;
              return (
                <div key={item.id}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onClick={() => setSelected(item)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
                  <div style={{ position: "relative" }}>
                    <img src={item.preview} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 10, right: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                      {sev.icon} {sev.label}
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.disease}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(item.timestamp)}</span>
                      <span style={{ fontSize: 13, color: item.confidence > 80 ? "#16a34a" : item.confidence > 60 ? "#ca8a04" : "#ef4444", fontWeight: 700 }}>
                        {item.confidence}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${item.confidence}%`, background: item.confidence > 80 ? "#16a34a" : item.confidence > 60 ? "#ca8a04" : "#ef4444" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <HistoryDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={deleteItem}
        />
      )}
    </div>
  );
}