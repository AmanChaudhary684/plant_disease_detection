// pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SEVERITY_CONFIG = {
  None:    { text: "#16a34a", icon: "✅", label: "Healthy" },
  Low:     { text: "#ca8a04", icon: "🟡", label: "Low Risk" },
  Medium:  { text: "#ea580c", icon: "⚠️", label: "Medium" },
  High:    { text: "#ef4444", icon: "🚨", label: "High Risk" },
  Unknown: { text: "#6b7280", icon: "❓", label: "Unknown" },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
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
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 12 }}>
            🕐 Scan History
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,36px)", fontWeight: 800, color: "#111827" }}>
            Your Previous Scans
          </h1>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
            🗑️ Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8 }}>No scans yet</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Upload a leaf image to get started</div>
          <button onClick={() => navigate("/diagnose")} style={{ background: "#16a34a", border: "none", color: "#fff", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            🔬 Start Diagnosing
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {history.map(item => {
            const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.Unknown;
            return (
              <div key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer" }}
                onClick={() => navigate("/diagnose")}>
                <img src={item.preview} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.disease}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: sev.text, fontWeight: 600 }}>{sev.icon} {sev.label}</span>
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>{item.confidence}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(item.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}