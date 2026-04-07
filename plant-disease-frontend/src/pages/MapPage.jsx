// pages/MapPage.jsx — Outbreak Map page with live banner
import OutbreakMap from "../OutbreakMap";
import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── Live banner ─────────────────────────────────────────────────── */}
      <div style={M.banner}>
        <div style={M.bannerLeft}>
          <div style={M.bannerLive}>
            <div style={M.liveDot} />
            LIVE
          </div>
          <div>
            <div style={M.bannerTitle}>🗺️ India Disease Outbreak Map</div>
            <div style={M.bannerSub}>
              Real-time community reports · See what's spreading in your state · Updated every time a farmer reports
            </div>
          </div>
        </div>
        <div style={M.bannerRight}>
          <div style={M.bannerStat}>
            <div style={M.bannerStatVal}>Innovation #3</div>
            <div style={M.bannerStatLabel}>Unique feature</div>
          </div>
          <button style={M.reportBtn} onClick={() => navigate("/diagnose")}>
            🔬 Scan + Report
          </button>
        </div>
      </div>

      {/* ── How it works strip ──────────────────────────────────────────── */}
      <div style={M.howItWorks}>
        {[
          { icon: "📷", label: "Scan your diseased leaf" },
          { icon: "→",  label: "" },
          { icon: "📍", label: "Report to community" },
          { icon: "→",  label: "" },
          { icon: "🗺️", label: "Appears on outbreak map" },
          { icon: "→",  label: "" },
          { icon: "🚨", label: "Nearby farmers get alerted" },
        ].map((s, i) => (
          <div key={i} style={M.howStep}>
            <span style={{ fontSize: s.icon === "→" ? 16 : 22, color: s.icon === "→" ? "#9ca3af" : "inherit" }}>
              {s.icon}
            </span>
            {s.label && <span style={M.howLabel}>{s.label}</span>}
          </div>
        ))}
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <OutbreakMap />
    </div>
  );
}

const M = {
  banner: { background: "linear-gradient(135deg,#16a34a,#15803d)", borderRadius: 18, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 16 },
  bannerLeft: { display: "flex", alignItems: "center", gap: 14 },
  bannerLive: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", flexShrink: 0 },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" },
  bannerTitle: { fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Fraunces',serif" },
  bannerSub: { fontSize: 12, color: "#bbf7d0", lineHeight: 1.5 },
  bannerRight: { display: "flex", alignItems: "center", gap: 16 },
  bannerStat: { textAlign: "center" },
  bannerStatVal: { fontSize: 15, fontWeight: 800, color: "#fff" },
  bannerStatLabel: { fontSize: 10, color: "#bbf7d0" },
  reportBtn: { background: "#fff", border: "none", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" },
  howItWorks: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  howStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  howLabel: { fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 80, lineHeight: 1.3 },
};