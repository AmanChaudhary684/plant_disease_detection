// pages/ResultPage.jsx — Clean result display page
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import WeatherWidget from "../components/WeatherWidget";
import CropCalendar from "../CropCalendar";
import DiseaseStages from "../DiseaseStages";
import { CommunityReportButton } from "../CommunityReport";
import { exportDiagnosisPDF } from "../PDFExport";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SEVERITY_CONFIG = {
  None:    { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", icon: "✅", label: "Healthy" },
  Low:     { bg: "#fefce8", border: "#fde047", text: "#ca8a04", icon: "🟡", label: "Low Risk" },
  Medium:  { bg: "#fff7ed", border: "#fdba74", text: "#ea580c", icon: "⚠️", label: "Medium Risk" },
  High:    { bg: "#fef2f2", border: "#fecaca", text: "#ef4444", icon: "🚨", label: "High Risk" },
  Unknown: { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280", icon: "❓", label: "Unknown" },
};

export default function ResultPage({ result, preview, file }) {
  const navigate     = useNavigate();
  const { lang, t }  = useLang();
  const [activeTab, setActiveTab]         = useState("organic");
  const [showGradcam, setShowGradcam]     = useState(false);
  const [gradcam, setGradcam]             = useState(null);
  const [gradcamLoading, setGradcamLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  if (!result) { navigate("/diagnose"); return null; }

  const sev  = SEVERITY_CONFIG[result.disease_info.severity] || SEVERITY_CONFIG.Unknown;
  const conf = result.diagnosis.top_prediction.confidence;
  const confColor = conf > 80 ? "#16a34a" : conf > 60 ? "#ca8a04" : "#ef4444";

  const fetchGradcam = async () => {
    if (!file) return;
    setGradcamLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API_BASE}/api/detect/gradcam`, { method: "POST", body: form });
      const data = await res.json();
      if (data.gradcam?.available) { setGradcam(data.gradcam); setShowGradcam(true); }
    } catch {}
    finally { setGradcamLoading(false); }
  };

  const shareOnWhatsApp = () => {
    const disease = result.diagnosis.top_prediction.display_name;
    const treat   = result.disease_info.organic_treatment?.[0] || "";
    const msg = `🌿 *LeafDoc AI — Plant Disease Report*\n\n🔬 *Diagnosis:* ${disease}\n🎯 *Confidence:* ${conf}%\n⚠️ *Severity:* ${result.disease_info.severity}\n\n🌿 *Treatment:* ${treat}\n\n📱 Diagnosed by LeafDoc AI — Bennett University DTI Project`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const SECTIONS = [
    { id: "about",       label: "About Disease" },
    { id: "treatment",   label: "Treatment" },
    { id: "weather",     label: "Weather Risk" },
    { id: "calendar",    label: "Crop Calendar" },
    { id: "stages",      label: "Disease Stages" },
  ];

  return (
    <div style={R.page}>
      <div style={R.inner}>

        {/* Top bar */}
        <div style={R.topBar}>
          <button style={R.backBtn} onClick={() => navigate("/diagnose")}>
            ← New Scan
          </button>
          <div style={{ ...R.sevBadge, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>
            {sev.icon} {sev.label}
          </div>
        </div>

        <div style={R.grid}>
          {/* LEFT COLUMN */}
          <div style={R.leftCol}>

            {/* Leaf image */}
            <div style={R.imageCard}>
              <img
                src={showGradcam && gradcam?.overlay_image ? gradcam.overlay_image : preview}
                alt="leaf"
                style={R.leafImg}
              />
              <div style={R.imageFooter}>
                <span style={R.imageDiseaseLabel}>
                  {result.diagnosis.is_healthy ? "✅ Healthy Plant" : "🔬 Disease Detected"}
                </span>
                {!result.diagnosis.is_healthy && (
                  <button style={R.heatmapBtn} onClick={gradcam ? () => setShowGradcam(!showGradcam) : fetchGradcam} disabled={gradcamLoading}>
                    {gradcamLoading ? "⏳ Analyzing..." : gradcam ? (showGradcam ? "🖼️ Original" : "🔥 AI Heatmap") : "🔥 AI Heatmap"}
                  </button>
                )}
              </div>
              {showGradcam && (
                <div style={R.heatmapNote}>🔴 Red = disease focus · 🔵 Blue = less relevant</div>
              )}
            </div>

            {/* Diagnosis card */}
            <div style={R.diagCard}>
              <div style={R.diagLabel}>PRIMARY DIAGNOSIS</div>
              <div style={R.diagDisease}>{result.diagnosis.top_prediction.display_name}</div>

              <div style={R.confRow}>
                <span style={R.confLabel}>Confidence</span>
                <span style={{ ...R.confVal, color: confColor }}>{conf}%</span>
              </div>
              <div style={R.confBarBg}>
                <div style={{ ...R.confBarFill, width: `${conf}%`, background: confColor }} />
              </div>
              <div style={{ ...R.confLevel, color: confColor }}>
                {conf > 80 ? "✅ High confidence — reliable diagnosis"
                  : conf > 60 ? "⚠️ Medium confidence"
                  : "❓ Low confidence — try a clearer photo"}
              </div>

              {/* Low confidence warning < 40% */}
              {conf < 40 && (
                <div style={R.lowConfWarn}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
                    ⚠️ Low Confidence ({conf}%) — Diagnosis may not be reliable
                  </div>
                  <div style={{ color: "#7f1d1d", marginBottom: 8 }}>
                    <strong>Possible reasons:</strong><br />
                    • This crop may not be in our supported list<br />
                    • Photo needs better lighting or closer focus<br />
                    • Disease may be at a very early stage<br />
                    • Multiple leaves or background in the photo
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: "#dc2626", fontSize: 12 }}>
                      ✅ Our model supports these 14 crops:
                    </div>
                    <div style={{ color: "#374151", fontSize: 11, lineHeight: 1.7 }}>
                      Apple · Blueberry · Cherry · Corn · Grape · Orange · Peach ·
                      Pepper · Potato · Raspberry · Soybean (healthy only) ·
                      Squash · Strawberry · Tomato
                    </div>
                  </div>
                  <div style={{ color: "#7f1d1d", fontSize: 11 }}>
                    💡 <strong>Recommendation:</strong> Upload a clearer, closer photo
                    of only the diseased leaf in good natural lighting — or consult your
                    nearest <strong>Krishi Vigyan Kendra (KVK)</strong> for expert diagnosis.
                  </div>
                </div>
              )}

              {/* Medium confidence advisory 40-60% */}
              {conf >= 40 && conf < 60 && (
                <div style={{ marginTop: 10, background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#713f12", lineHeight: 1.6, marginBottom: 12 }}>
                  ⚠️ <strong>Medium confidence ({conf}%)</strong> — Result is plausible
                  but not certain. For high-value crops, verify with an agricultural
                  expert or try uploading a clearer photo.
                </div>
              )}

              {/* Voice */}
              <button style={R.voiceBtn} onClick={() => {
                const u = new SpeechSynthesisUtterance(`Diagnosis: ${result.diagnosis.top_prediction.display_name}. Confidence: ${conf} percent. Severity: ${result.disease_info.severity}.`);
                u.lang = lang === "hi" ? "hi-IN" : "en-IN";
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
              }}>
                🔊 {lang === "hi" ? "सुनें" : "Read Aloud"}
              </button>
            </div>

            {/* Other possibilities */}
            <div style={R.altCard}>
              <div style={R.altTitle}>OTHER POSSIBILITIES</div>
              {result.diagnosis.all_predictions.slice(1).map(p => (
                <div key={p.class_id} style={R.altRow}>
                  <span style={R.altName}>{p.display_name}</span>
                  <div style={R.altBarBg}><div style={{ ...R.altBarFill, width: `${p.confidence}%` }} /></div>
                  <span style={R.altConf}>{p.confidence}%</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={R.actions}>
              <button style={R.actionBtn} onClick={() => navigate("/diagnose")}>
                🔬 Scan Another Leaf
              </button>
              <button style={{ ...R.actionBtn, ...R.actionBtnBlue }} onClick={() => exportDiagnosisPDF(result, preview, lang)}>
                📄 Download PDF
              </button>
              <button style={{ ...R.actionBtn, ...R.actionBtnWhatsapp }} onClick={shareOnWhatsApp}>
                📱 Share on WhatsApp
              </button>
              <button style={{ ...R.actionBtn, ...R.actionBtnPurple }} onClick={() => navigate("/progression")}>
                📊 Track Progression
              </button>
              <CommunityReportButton result={result} lang={lang} />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={R.rightCol}>

            {/* Section tabs */}
            <div style={R.sectionTabs}>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  style={{ ...R.sectionTab, ...(activeSection === s.id ? R.sectionTabActive : {}) }}
                  onClick={() => setActiveSection(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* About Disease */}
            {activeSection === "about" && (
              <div style={R.sectionCard}>
                <h3 style={R.sectionH3}>📋 About This Disease</h3>
                <p style={R.sectionDesc}>{result.disease_info.description}</p>
                {result.disease_info.symptoms?.length > 0 && (
                  <div style={R.infoBlock}>
                    <div style={R.infoBlockTitle}>🔍 Symptoms</div>
                    {result.disease_info.symptoms.map((s, i) => (
                      <div key={i} style={R.infoItem}><span style={R.infoDot}>▸</span><span>{s}</span></div>
                    ))}
                  </div>
                )}
                <div style={R.infoBlock}>
                  <div style={R.infoBlockTitle}>🧫 Causes</div>
                  <p style={R.sectionDesc}>{result.disease_info.causes}</p>
                </div>
              </div>
            )}

            {/* Treatment */}
            {activeSection === "treatment" && (
              <div style={R.sectionCard}>
                <h3 style={R.sectionH3}>💊 Treatment Options</h3>
                <div style={R.treatTabs}>
                  {[
                    { id: "organic",    label: "🌿 Organic"    },
                    { id: "chemical",   label: "⚗️ Chemical"   },
                    { id: "prevention", label: "🛡️ Prevention" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      style={{ ...R.treatTab, ...(activeTab === tab.id ? R.treatTabActive : {}) }}
                      onClick={() => setActiveTab(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div style={R.treatList}>
                  {(activeTab === "organic"     ? result.disease_info.organic_treatment
                    : activeTab === "chemical"  ? result.disease_info.chemical_treatment
                    : result.disease_info.prevention)?.map((item, i) => (
                    <div key={i} style={R.treatItem}>
                      <span style={R.treatNum}>{i + 1}</span>
                      <span style={R.treatText}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Risk */}
            {activeSection === "weather" && (
              <div style={R.sectionCard}>
                <WeatherWidget disease={result.diagnosis.top_prediction.class_id} />
              </div>
            )}

            {/* Crop Calendar */}
            {activeSection === "calendar" && (
              <div style={R.sectionCard}>
                <CropCalendar diseaseClassId={result.diagnosis.top_prediction.class_id} lang={lang} />
              </div>
            )}

            {/* Disease Stages */}
            {activeSection === "stages" && (
              <div style={R.sectionCard}>
                <DiseaseStages diseaseClassId={result.diagnosis.top_prediction.class_id} lang={lang} />
              </div>
            )}

            {/* Disclaimer */}
            <div style={R.disclaimer}>
              ⚠️ This is an AI-based preliminary diagnosis. For high-value crops, please consult a certified agricultural expert.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const R = {
  page: { minHeight: "calc(100vh - 64px)", background: "#f8fffe", padding: "32px 24px" },
  inner: { maxWidth: 1100, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backBtn: { background: "#fff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: 10, padding: "8px 16px", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  sevBadge: { borderRadius: 20, padding: "8px 20px", fontSize: 14, fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24, alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol: { display: "flex", flexDirection: "column", gap: 16 },
  // Image
  imageCard: { borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  leafImg: { width: "100%", maxHeight: 280, objectFit: "cover", display: "block" },
  imageFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f9fafb", borderTop: "1px solid #e5e7eb" },
  imageDiseaseLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
  heatmapBtn: { background: "#fff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  heatmapNote: { padding: "6px 16px", background: "#f0fdf4", fontSize: 11, color: "#16a34a", textAlign: "center" },
  // Diagnosis
  diagCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  diagLabel: { fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: "0.1em", marginBottom: 6 },
  diagDisease: { fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 14 },
  confRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  confLabel: { fontSize: 13, color: "#6b7280" },
  confVal: { fontSize: 15, fontWeight: 700 },
  confBarBg: { height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  confBarFill: { height: "100%", borderRadius: 4, transition: "width 1s ease" },
  confLevel: { fontSize: 12, marginBottom: 12 },
  lowConfWarn: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#dc2626", lineHeight: 1.6, marginBottom: 12 },
  voiceBtn: { width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  // Alt predictions
  altCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 },
  altTitle: { fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", marginBottom: 10 },
  altRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  altName: { fontSize: 12, color: "#374151", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  altBarBg: { width: 60, height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" },
  altBarFill: { height: "100%", background: "#22c55e", borderRadius: 2 },
  altConf: { fontSize: 12, color: "#16a34a", fontWeight: 600, width: 36, textAlign: "right" },
  // Actions
  actions: { display: "flex", flexDirection: "column", gap: 8 },
  actionBtn: { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  actionBtnBlue: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb" },
  actionBtnWhatsapp: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
  actionBtnPurple: { background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed" },
  // Section tabs
  sectionTabs: { display: "flex", gap: 4, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 4, flexWrap: "wrap" },
  sectionTab: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "#6b7280", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" },
  sectionTabActive: { background: "#f0fdf4", color: "#16a34a", fontWeight: 700 },
  sectionCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 },
  sectionH3: { fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 },
  sectionDesc: { fontSize: 13, color: "#4b5563", lineHeight: 1.7, marginBottom: 4 },
  infoBlock: { marginTop: 14 },
  infoBlockTitle: { fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 },
  infoItem: { display: "flex", gap: 8, fontSize: 13, color: "#4b5563", marginBottom: 6, lineHeight: 1.6 },
  infoDot: { color: "#16a34a", flexShrink: 0 },
  // Treatment
  treatTabs: { display: "flex", gap: 6, marginBottom: 16 },
  treatTab: { padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  treatTabActive: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontWeight: 600 },
  treatList: { display: "flex", flexDirection: "column", gap: 10 },
  treatItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  treatNum: { width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  treatText: { fontSize: 13, color: "#4b5563", lineHeight: 1.65 },
  // Disclaimer
  disclaimer: { background: "#fefce8", border: "1px solid #fde047", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#713f12", lineHeight: 1.65 },
};