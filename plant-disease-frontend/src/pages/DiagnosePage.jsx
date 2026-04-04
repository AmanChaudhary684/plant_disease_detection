// pages/DiagnosePage.jsx — Clean upload and detection page
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { OfflineDetector } from "../OfflineMode";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function DiagnosePage({ onResult }) {
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const fileRef = useRef();
  const { lang, t } = useLang();
  const navigate    = useNavigate();

  const handleFile = useCallback((f) => {
    if (!f?.type.startsWith("image/")) { setError("Please upload a JPG or PNG image."); return; }
    setFile(f); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API_BASE}/api/detect`, { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Detection failed"); }
      const data = await res.json();
      onResult(data, preview, file);
      navigate("/result");
    } catch (e) {
      setError(e.message || "Cannot connect to server.");
    } finally { setLoading(false); }
  };

  const handleOfflineResult = (offlineResult) => {
    const isHealthy = offlineResult.diagnosis.is_healthy;
    const topClass  = offlineResult.diagnosis.top_prediction.class_id;
    const diseaseInfo = {
      description: "Offline diagnosis — connect to internet for detailed information.",
      symptoms: ["Connect to internet for detailed symptom information"],
      causes: "Connect to internet for detailed cause information.",
      organic_treatment: ["Consult agricultural expert for treatment options"],
      chemical_treatment: ["Consult agricultural expert for treatment options"],
      prevention: ["Early detection and regular monitoring"],
      severity: isHealthy ? "None" : "Medium",
    };
    onResult({ ...offlineResult, disease_info: diseaseInfo }, preview, file);
    navigate("/result");
  };

  return (
    <div style={D.page}>
      <div style={D.inner}>

        {/* Page header */}
        <div style={D.pageHeader}>
          <div style={D.pageBadge}>🔬 AI-Powered Diagnosis</div>
          <h1 style={D.pageH1}>
            {lang === "hi" ? "पौधे की बीमारी पहचानें" : "Diagnose Your Plant"}
          </h1>
          <p style={D.pageDesc}>
            {lang === "hi"
              ? "बीमार पत्ती की फोटो अपलोड करें और 2 सेकंड में AI निदान पाएं।"
              : "Upload a photo of any diseased leaf and get an instant AI diagnosis with treatment recommendations."}
          </p>
        </div>

        <div style={D.layout}>
          {/* Upload area */}
          <div style={D.uploadSection}>
            <div
              style={{
                ...D.uploadZone,
                ...(dragOver ? D.uploadZoneActive : {}),
                ...(preview ? D.uploadZoneWithPreview : {}),
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => !preview && fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])} />

              {!preview ? (
                <div style={D.uploadContent}>
                  <div style={D.uploadIconWrap}>
                    <span style={{ fontSize: 40 }}>📷</span>
                  </div>
                  <div style={D.uploadTitle}>
                    {lang === "hi" ? "यहाँ फोटो डालें" : "Drop your leaf photo here"}
                  </div>
                  <div style={D.uploadSub}>
                    {lang === "hi" ? "या क्लिक करके चुनें" : "or click to browse files"}
                  </div>
                  <div style={D.uploadFormats}>JPG · PNG · WebP · Max 50MB</div>
                </div>
              ) : (
                <div style={D.previewWrap}>
                  <img src={preview} alt="leaf" style={D.previewImg} />
                  <div style={D.previewOverlay}>
                    <button style={D.previewChangeBtn}
                      onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>
                      📁 Change Photo
                    </button>
                    <button style={D.previewRemoveBtn}
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={D.errorBox}>⚠️ {error}</div>
            )}

            <button
              style={{ ...D.detectBtn, ...(!file || loading ? D.detectBtnDisabled : {}) }}
              disabled={!file || loading}
              onClick={handleDetect}>
              {loading
                ? <><span style={D.btnSpinner} /> {lang === "hi" ? "पहचान हो रही है..." : "Analyzing..."}</>
                : <>🔬 {lang === "hi" ? "बीमारी पहचानें" : "Detect Disease"}</>}
            </button>

            {/* Offline mode */}
            <button style={D.offlineBtn} onClick={() => setShowOffline(!showOffline)}>
              📵 {lang === "hi" ? "ऑफलाइन मोड" : "Use Offline Mode"}
            </button>

            {showOffline && file && preview && (
              <div style={{ marginTop: 16 }}>
                <OfflineDetector file={file} preview={preview} onResult={handleOfflineResult} />
              </div>
            )}
          </div>

          {/* Right side tips */}
          <div style={D.tipsSection}>
            <div style={D.tipsCard}>
              <div style={D.tipsTitle}>📸 Tips for Best Results</div>
              {[
                { icon: "☀️", tip: "Good natural lighting — avoid shadows" },
                { icon: "🔍", tip: "Focus on the diseased area of the leaf" },
                { icon: "📐", tip: "Hold phone steady — avoid blur" },
                { icon: "🍃", tip: "Show one leaf clearly, not the whole plant" },
                { icon: "🎨", tip: "Capture the full range of symptoms" },
              ].map((t, i) => (
                <div key={i} style={D.tipItem}>
                  <span style={D.tipIcon}>{t.icon}</span>
                  <span style={D.tipText}>{t.tip}</span>
                </div>
              ))}
            </div>

            <div style={D.statsCard}>
              <div style={D.tipsTitle}>🤖 About Our Model</div>
              {[
                { label: "Architecture", value: "SWIN Transformer" },
                { label: "Parameters", value: "86.8M" },
                { label: "Lab Accuracy", value: "99.74%" },
                { label: "Real-World Acc", value: "73.19%" },
                { label: "Disease Classes", value: "38" },
                { label: "Training Images", value: "8,237" },
              ].map(s => (
                <div key={s.label} style={D.statRow}>
                  <span style={D.statRowLabel}>{s.label}</span>
                  <span style={D.statRowVal}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={D.cropsCard}>
              <div style={D.tipsTitle}>🌾 Supported Crops</div>
              <div style={D.cropsList}>
                {["Apple","Blueberry","Cherry","Corn","Grape","Orange","Peach","Pepper","Potato","Raspberry","Soybean","Squash","Strawberry","Tomato"].map(c => (
                  <span key={c} style={D.cropTag}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const D = {
  page: { minHeight: "calc(100vh - 64px)", background: "#f8fffe", padding: "40px 24px" },
  inner: { maxWidth: 1100, margin: "0 auto" },
  pageHeader: { textAlign: "center", marginBottom: 40 },
  pageBadge: { display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 12 },
  pageH1: { fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 800, color: "#111827", marginBottom: 12 },
  pageDesc: { fontSize: 16, color: "#6b7280", lineHeight: 1.7 },
  layout: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, alignItems: "start" },
  uploadSection: { display: "flex", flexDirection: "column", gap: 12 },
  uploadZone: { border: "2px dashed #bbf7d0", borderRadius: 20, background: "#fff", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease", overflow: "hidden" },
  uploadZoneActive: { border: "2px dashed #16a34a", background: "#f0fdf4", transform: "scale(1.01)" },
  uploadZoneWithPreview: { border: "2px solid #bbf7d0", cursor: "default", minHeight: 360 },
  uploadContent: { textAlign: "center", padding: 40 },
  uploadIconWrap: { width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  uploadTitle: { fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8 },
  uploadSub: { fontSize: 14, color: "#9ca3af", marginBottom: 12 },
  uploadFormats: { display: "inline-block", background: "#f3f4f6", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: "#6b7280" },
  previewWrap: { position: "relative", width: "100%" },
  previewImg: { width: "100%", maxHeight: 400, objectFit: "contain", display: "block", borderRadius: 18 },
  previewOverlay: { position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 },
  previewChangeBtn: { background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  previewRemoveBtn: { background: "rgba(220,38,38,0.7)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 14 },
  detectBtn: { width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "#16a34a", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(22,163,74,0.3)" },
  detectBtnDisabled: { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" },
  btnSpinner: { width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" },
  offlineBtn: { width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  // Right side
  tipsSection: { display: "flex", flexDirection: "column", gap: 16 },
  tipsCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  tipsTitle: { fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 },
  tipItem: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  tipIcon: { fontSize: 16, flexShrink: 0 },
  tipText: { fontSize: 13, color: "#4b5563", lineHeight: 1.5 },
  statsCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  statRowLabel: { fontSize: 13, color: "#6b7280" },
  statRowVal: { fontSize: 13, fontWeight: 700, color: "#16a34a" },
  cropsCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 },
  cropsList: { display: "flex", flexWrap: "wrap", gap: 6 },
  cropTag: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 8px", fontSize: 12, color: "#16a34a", fontWeight: 500 },
};