import { useState, useRef, useCallback, useEffect } from "react";
import OutbreakMap from "./OutbreakMap";
import { ConnectivityBanner, OfflineDetector, OfflineBadge } from "./OfflineMode";
import { LanguageProvider, useLang, LangToggle } from "./LanguageContext";
import ProgressionTracker, { AddToPlantModal } from "./ProgressionTracker";
import { DISEASE_NAME_TRANSLATIONS } from "./translations";
import { CommunityReportButton } from "./CommunityReport";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import { exportDiagnosisPDF } from "./PDFExport";
import CropCalendar from "./CropCalendar";
import DiseaseStages from "./DiseaseStages";

// ── Weather Widget Component ───────────────────────────────────────────────
function WeatherWidget({ disease }) {
  const lang = localStorage.getItem("leafdoc_lang") || "en";
  const [weather, setWeather]     = useState(null);
  const [risk, setRisk]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [inputCity, setInputCity] = useState("");
  const [error, setError]         = useState("");

  const fetchWeather = async (params) => {
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({ ...params, disease: disease || "" }).toString();
      const res = await fetch(`${API_BASE}/api/weather/risk?${qs}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      const data = await res.json();
      if (data.success) { setWeather(data.weather); setRisk(data.disease_risk); }
      else setError("Weather data unavailable.");
    } catch (e) { setError("Could not fetch weather. Check internet connection."); }
    finally { setLoading(false); }
  };

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (inputCity.trim()) fetchWeather({ city: inputCity.trim() });
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { setError("GPS not supported."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { setError("Could not get location. Enter city name instead."); setLoading(false); }
    );
  };

  const RISK_COLORS = {
    Critical: { bg:"rgba(239,68,68,0.12)", border:"rgba(239,68,68,0.35)", text:"#f87171", bar:"#ef4444" },
    High:     { bg:"rgba(249,115,22,0.12)", border:"rgba(249,115,22,0.35)", text:"#fb923c", bar:"#f97316" },
    Moderate: { bg:"rgba(234,179,8,0.12)",  border:"rgba(234,179,8,0.35)",  text:"#fbbf24", bar:"#eab308" },
    Low:      { bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.35)",  text:"#4ade80", bar:"#22c55e" },
    Unknown:  { bg:"rgba(107,114,128,0.12)",border:"rgba(107,114,128,0.35)",text:"#9ca3af", bar:"#6b7280" },
  };
  const rc = risk ? (RISK_COLORS[risk.level] || RISK_COLORS.Unknown) : null;

  return (
    <div style={SW.card}>
      <div style={SW.header}>
        <span style={{fontSize:18}}>🌦️</span>
        <span style={SW.headerTitle}>{lang === "hi" ? "पर्यावरणीय जोखिम विश्लेषण" : "Environmental Risk Analysis"}</span>
        <span style={SW.headerBadge}>{lang === "hi" ? "नवाचार #2" : "Innovation #2"}</span>
      </div>
      <p style={SW.desc}>{lang === "hi" ? "जांचें कि आज का मौसम आपके क्षेत्र में रोग फैलने का जोखिम बढ़ाता है या नहीं।" : "Check if today's weather conditions increase disease spread risk in your area."}</p>

      {!weather && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <form onSubmit={handleCitySearch} style={{display:"flex",gap:8}}>
            <input style={SW.cityInput} placeholder={lang === "hi" ? "अपना शहर दर्ज करें (जैसे दिल्ली, पुणे...)" : "Enter your city (e.g. Delhi, Pune...)"}
              value={inputCity} onChange={e => setInputCity(e.target.value)} />
            <button type="submit" style={SW.cityBtn} disabled={loading}>{loading ? "..." : lang === "hi" ? "जांचें" : "Check"}</button>
          </form>
          <button style={SW.gpsBtn} onClick={handleGPS} disabled={loading}>{lang === "hi" ? "📍 मेरी लोकेशन उपयोग करें" : "📍 Use My Location"}</button>
        </div>
      )}

      {error && <div style={SW.error}>⚠️ {error}</div>}
      {loading && <div style={SW.loading}><span style={SW.spinner}/><span>Fetching weather data...</span></div>}

      {weather && risk && !loading && (
        <div>
          <div style={SW.statsGrid}>
            {[
              {icon:"🌡️", val:`${weather.temperature}°C`, label: lang === "hi" ? "तापमान" : "Temp"},
              {icon:"💧", val:`${weather.humidity}%`,      label: lang === "hi" ? "नमी" : "Humidity"},
              {icon:"🌧️", val:`${weather.rainfall_mm}mm`, label: lang === "hi" ? "वर्षा" : "Rainfall"},
              {icon:"💨", val:`${weather.wind_kmh} km/h`, label: lang === "hi" ? "हवा" : "Wind"},
            ].map(s => (
              <div key={s.label} style={SW.statCard}>
                <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                <div style={SW.statVal}>{s.val}</div>
                <div style={SW.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={SW.condRow}>
            <span style={{fontSize:20}}>{weather.condition_icon}</span>
            <span style={SW.condText}>{weather.condition}</span>
            <span style={{fontSize:12,color:"#6ee7b7"}}>3-day rain: {weather.rain_3day_mm}mm</span>
          </div>
          <div style={{...SW.riskBox, background:rc.bg, border:`1px solid ${rc.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:700,color:rc.text}}>{risk.level_icon} {risk.level} Risk</span>
              <span style={{fontSize:20,fontWeight:800,fontFamily:"'Clash Display',sans-serif",color:rc.text}}>{risk.score}/100</span>
            </div>
            <div style={SW.riskTrack}><div style={{...SW.riskFill,width:`${risk.score}%`,background:rc.bar}}/></div>
            <p style={{fontSize:13,lineHeight:1.6,fontWeight:500,color:rc.text,marginBottom:8}}>{risk.message}</p>
            {risk.tip && <p style={SW.riskTip}>💡 <strong>Action:</strong> {risk.tip}</p>}
            {risk.factors?.length > 0 && (
              <div style={{marginTop:6}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Contributing factors:</div>
                {risk.factors.map((f,i) => <div key={i} style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.7}}>▸ {f}</div>)}
              </div>
            )}
          </div>
          <button style={SW.changeBtn} onClick={() => {setWeather(null);setRisk(null);setInputCity("");}}>
            {lang === "hi" ? "📍 स्थान बदलें" : "📍 Change Location"}
          </button>
        </div>
      )}
    </div>
  );
}

const SW = {
  card:{ background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:18, padding:"20px", backdropFilter:"blur(16px)" },
  header:{ display:"flex", alignItems:"center", gap:10, marginBottom:8 },
  headerTitle:{ fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:"#bbf7d0", flex:1 },
  headerBadge:{ background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 },
  desc:{ fontSize:13, color:"#6ee7b7", lineHeight:1.6, marginBottom:14 },
  cityInput:{ flex:1, background:"rgba(0,0,0,0.3)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:10, padding:"9px 14px", color:"#e2f5e6", fontSize:13, fontFamily:"'Cabinet Grotesk',sans-serif", outline:"none" },
  cityBtn:{ background:"linear-gradient(135deg,#16a34a,#15803d)", border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif" },
  gpsBtn:{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:10, padding:"9px 14px", color:"#86efac", fontSize:13, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500, textAlign:"center" },
  error:{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginTop:10 },
  loading:{ display:"flex", alignItems:"center", gap:10, color:"#6ee7b7", fontSize:13, padding:"14px 0" },
  spinner:{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(74,222,128,0.3)", borderTopColor:"#4ade80", animation:"spin 0.8s linear infinite", display:"inline-block" },
  statsGrid:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 },
  statCard:{ background:"rgba(0,0,0,0.25)", borderRadius:10, padding:"10px 6px", textAlign:"center" },
  statVal:{ fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:"#4ade80", marginBottom:2 },
  statLabel:{ fontSize:10, color:"#6ee7b7", fontWeight:500 },
  condRow:{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"8px 10px", background:"rgba(0,0,0,0.2)", borderRadius:10 },
  condText:{ fontSize:13, color:"#d1fae5", fontWeight:600, flex:1 },
  riskBox:{ borderRadius:14, padding:"14px", marginBottom:10 },
  riskTrack:{ height:6, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden", marginBottom:10 },
  riskFill:{ height:"100%", borderRadius:3, transition:"width 1s ease" },
  riskTip:{ fontSize:12, color:"#a7f3d0", lineHeight:1.6, background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"8px 10px", marginBottom:8 },
  changeBtn:{ width:"100%", background:"transparent", border:"1px solid rgba(74,222,128,0.2)", borderRadius:10, padding:"8px", color:"#6ee7b7", fontSize:12, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", marginTop:4 },
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Voice Output ──────────────────────────────────────────────────────────
const speak = (text, langCode = "en-IN") => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};

const speakDiagnosis = (result, language) => {
  if (!result) return;
  const disease = result.diagnosis.top_prediction.display_name;
  const conf    = result.diagnosis.top_prediction.confidence;
  const sev     = result.disease_info.severity;
  const treat   = result.disease_info.organic_treatment?.[0] || "";

  if (language === "hi") {
    const text = `निदान: ${disease}। विश्वास स्तर: ${conf} प्रतिशत। गंभीरता: ${sev}। उपचार: ${treat}`;
    speak(text, "hi-IN");
  } else {
    const text = `Diagnosis: ${disease}. Confidence: ${conf} percent. Severity: ${sev}. First treatment: ${treat}`;
    speak(text, "en-IN");
  }
};

const SEVERITY_CONFIG = {
  None:    { bg: "#052e16", border: "#16a34a", text: "#4ade80", icon: "✅", label: "Healthy" },
  Low:     { bg: "#1c1917", border: "#ca8a04", text: "#fbbf24", icon: "🟡", label: "Low Risk" },
  Medium:  { bg: "#1c0a00", border: "#ea580c", text: "#fb923c", icon: "⚠️", label: "Medium Risk" },
  High:    { bg: "#1a0000", border: "#dc2626", text: "#f87171", icon: "🚨", label: "High Risk" },
  Unknown: { bg: "#111827", border: "#6b7280", text: "#9ca3af", icon: "❓", label: "Unknown" },
};

function timeAgo(iso, lang) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return lang === "hi" ? "अभी" : "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AppInner() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [screen, setScreen]               = useState("home");
  const [dragOver, setDragOver]           = useState(false);
  const [preview, setPreview]             = useState(null);
  const [file, setFile]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState(null);
  const [activeTab, setActiveTab]         = useState("organic");
  const [history, setHistory]             = useState([]);
  const [showHistory, setShowHistory]     = useState(false);
  const [showOffline, setShowOffline]     = useState(false);
  const [isOfflineResult, setIsOfflineResult]   = useState(false);
  const [showAddToPlant, setShowAddToPlant]     = useState(false);
  const fileRef = useRef();
  const { t, lang } = useLang();
  const [gradcam, setGradcam]             = useState(null);   // gradcam result
  const [showGradcam, setShowGradcam]     = useState(false);  // toggle overlay
  const [gradcamLoading, setGradcamLoading] = useState(false);

  const translateDisease = (name) => {
    if (lang === "en") return name;
    const match = DISEASE_NAME_TRANSLATIONS[name];
    return match?.hi || name;
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leafdoc_history") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  const handleFile = useCallback((f) => {
    if (!f?.type.startsWith("image/")) { setError("Please upload a JPG or PNG image."); return; }
    setFile(f); setError(null); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API_BASE}/api/detect`, { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Detection failed"); }
      const data = await res.json();
      setResult(data);
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        preview: preview,
        disease: data.diagnosis.top_prediction.display_name,
        confidence: data.diagnosis.top_prediction.confidence,
        isHealthy: data.diagnosis.is_healthy,
        severity: data.disease_info.severity,
      };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem("leafdoc_history", JSON.stringify(newHistory));
      setTimeout(() => speakDiagnosis(data, lang), 500);
      setScreen("result");
    } catch (e) {
      setError(e.message || "Cannot connect to server. Make sure backend is running on port 8000.");
    } finally { setLoading(false); }
  };

  const fetchGradcam = async () => {
    if (!file || !result) return;
    setGradcamLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API_BASE}/api/detect/gradcam`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Grad-CAM request failed");
      const data = await res.json();
      if (data.gradcam?.available) {
        setGradcam(data.gradcam);
        setShowGradcam(true);
      } else {
        alert("Grad-CAM not available for this image.");
      }
    } catch (e) {
      console.error("Grad-CAM error:", e);
      alert("Could not generate heatmap. Please try again.");
    } finally {
      setGradcamLoading(false);
    }
  };

  const shareOnWhatsApp = (result, lang) => {
    const disease  = result.diagnosis.top_prediction.display_name;
    const conf     = result.diagnosis.top_prediction.confidence;
    const sev      = result.disease_info.severity;
    const treat    = result.disease_info.organic_treatment?.[0] || "";
    const chemical = result.disease_info.chemical_treatment?.[0] || "";
  
    const msg = lang === "hi"
      ? `🌿 *LeafDoc AI — पौधे की बीमारी रिपोर्ट*\n\n` +
        `🔬 *निदान:* ${disease}\n` +
        `🎯 *विश्वास स्तर:* ${conf}%\n` +
        `⚠️ *गंभीरता:* ${sev}\n\n` +
        `🌿 *जैविक उपचार:* ${treat}\n` +
        `⚗️ *रासायनिक उपचार:* ${chemical}\n\n` +
        `📱 LeafDoc AI द्वारा निदान — Bennett University DTI Project\n` +
        `🔗 ${window.location.origin}`
      : `🌿 *LeafDoc AI — Plant Disease Report*\n\n` +
        `🔬 *Diagnosis:* ${disease}\n` +
        `🎯 *Confidence:* ${conf}%\n` +
        `⚠️ *Severity:* ${sev}\n\n` +
        `🌿 *Organic Treatment:* ${treat}\n` +
        `⚗️ *Chemical Treatment:* ${chemical}\n\n` +
        `📱 Diagnosed by LeafDoc AI — Bennett University DTI Project\n` +
        `🔗 ${window.location.origin}`;
  
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleOfflineResult = (offlineResult) => {
    const topClass  = offlineResult.diagnosis.top_prediction.class_id;
    const isHealthy = offlineResult.diagnosis.is_healthy;
    const diseaseInfoFetch = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/diseases/${encodeURIComponent(topClass)}`);
        if (r.ok) return await r.json();
      } catch {}
      return {
        description: "Offline diagnosis — detailed disease info available when online.",
        symptoms: ["Connect to internet for detailed symptom information"],
        causes: "Connect to internet for detailed cause information",
        organic_treatment: ["Consult agricultural expert for treatment options"],
        chemical_treatment: ["Consult agricultural expert for treatment options"],
        prevention: ["Early detection and regular monitoring"],
        severity: isHealthy ? "None" : "Medium",
      };
    };
    diseaseInfoFetch().then(diseaseInfo => {
      setResult({ ...offlineResult, disease_info: diseaseInfo });
      setIsOfflineResult(true);
      setShowOffline(false);
      setScreen("result");
    });
  };

  const reset = () => {
    setScreen("home"); setPreview(null); setFile(null);
    setResult(null); setError(null); setActiveTab("organic");
    setIsOfflineResult(false); setShowOffline(false);
    setGradcam(null); setShowGradcam(false);
  };

  // ── Auth gate: show login if not signed in ──
  if (authLoading) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(74,222,128,0.3)", borderTopColor: "#4ade80", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#6ee7b7", fontSize: 14 }}>Loading...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } body { background: #050e07; }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={S.root}>
      <div style={S.noise} />
      <div style={S.particles}>
        {["🌿","🍃","🌱","🍀","🌾"].map((e, i) => (
          <span key={i} style={{ ...S.particle, animationDelay: `${i * 1.8}s`, left: `${10 + i * 18}%` }}>{e}</span>
        ))}
      </div>

      <div style={S.app}>
        {/* HEADER */}
        <header style={S.header}>
          <div style={S.headerLeft} onClick={reset} className="clickable">
            <div style={S.logoMark}><span>🌿</span></div>
            <div>
              <div style={S.logoName}>LeafDoc<span style={S.logoAI}> AI</span></div>
              <div style={S.logoTagline}>{t("tagline")}</div>
            </div>
          </div>
          <div style={S.headerRight}>
            <div style={S.modelBadge}><span style={S.modelDot} />SWIN Transformer · 73.19% Real-World Accuracy</div>
            <button style={{ ...S.historyBtn, ...(showHistory ? S.historyBtnActive : {}) }}
              onClick={() => setShowHistory(!showHistory)}>
              🕐 {t("history")} {history.length > 0 && <span style={S.historyCount}>{history.length}</span>}
            </button>
            <button style={{ ...S.historyBtn, ...(screen === "map" ? S.historyBtnActive : {}) }}
              onClick={() => setScreen(prev => prev === "map" ? "home" : "map")}>
              🗺️ {t("outbreak_map")}
            </button>
            <button style={{ ...S.historyBtn, ...(showOffline ? S.historyBtnActive : {}) }}
              onClick={() => setShowOffline(o => !o)}>
              📵 {t("offline_mode")}
            </button>
            <LangToggle />
            {/* User profile */}
            {user && (
              <div style={S.userProfile}>
                <img
                  src={user.photoURL || ""}
                  alt={user.displayName || "User"}
                  style={S.userAvatar}
                  referrerPolicy="no-referrer"
                />
                <span style={S.userName}>{user.displayName?.split(" ")[0]}</span>
                <button style={S.signOutBtn} onClick={signOut} title="Sign out">
                  ↗
                </button>
              </div>
            )}
            <button style={{ ...S.historyBtn, ...(screen === "progression" ? S.historyBtnActive : {}) }}
              onClick={() => setScreen(prev => prev === "progression" ? "home" : "progression")}>
              📊 {lang === "hi" ? "प्रगति ट्रैकर" : "Progression"}
            </button>
          </div>
        </header>

        <ConnectivityBanner onOfflineModeClick={() => setShowOffline(true)} />

        {/* HISTORY PANEL */}
        {showHistory && (
          <div style={S.historyPanel}>
            <div style={S.historyHeader}>
              <span style={S.historyTitle}>📋 {t("scan_history")}</span>
              {history.length > 0 && (
                <button style={S.clearBtn} onClick={() => {
                  setHistory([]); localStorage.removeItem("leafdoc_history");
                }}>{t("clear_all")}</button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={S.historyEmpty}>No scans yet — upload a leaf image to get started!</div>
            ) : (
              <div style={S.historyList}>
                {history.map((item) => {
                  const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.Unknown;
                  return (
                    <div key={item.id} style={S.historyItem} className="clickable"
                      onClick={() => { setPreview(item.preview); setShowHistory(false); }}>
                      <img src={item.preview} alt="" style={S.historyThumb} />
                      <div style={S.historyItemInfo}>
                        <div style={S.historyItemDisease}>{item.disease}</div>
                        <div style={S.historyItemMeta}>
                          <span style={{ color: sev.text }}>{sev.icon} {sev.label}</span>
                          <span style={S.historyItemConf}>{item.confidence}%</span>
                        </div>
                        <div style={S.historyItemTime}>{timeAgo(item.timestamp, lang)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OFFLINE PANEL */}
        {showOffline && (
          <div style={{marginBottom:20}}>
            <OfflineDetector file={file} preview={preview} onResult={handleOfflineResult} />
          </div>
        )}

        {/* HOME SCREEN */}
        {screen === "home" && (
          <main style={S.main}>
            <div style={S.hero}>
              <div style={S.heroEyebrow}>🔬 AI-Powered Diagnosis</div>
              <h1 style={S.h1}>
                Detect Plant Diseases<br />
                <span style={S.h1Gradient}>Instantly & Accurately</span>
              </h1>
              <p style={S.heroSub}>
                Photograph any diseased leaf. Our EfficientNet-B3 model — trained on 50,000+ images
                across 38 disease classes — gives you an instant diagnosis with treatment recommendations.
              </p>
            </div>

            <div
              style={{ ...S.uploadZone, ...(dragOver ? S.uploadZoneActive : {}), ...(preview ? S.uploadZonePreview : {}) }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !preview && fileRef.current.click()}
              className={!preview ? "clickable" : ""}
            >
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])} />
              {!preview ? (
                <div style={S.uploadContent}>
                  <div style={S.uploadIconRing}><span style={{ fontSize: 34 }}>📷</span></div>
                  <div style={S.uploadTitle}>{t("drag_drop")}</div>
                  <div style={S.uploadSub}>{t("or_text")} {t("browse_files")}</div>
                  <div style={S.uploadFormats}>{t("supports")}</div>
                  <div style={S.uploadPrivacy}>🔒 Private · Free · No account needed</div>
                </div>
              ) : (
                <div style={S.previewContainer}>
                  <img src={preview} alt="leaf preview" style={S.previewImg} />
                  <div style={S.previewActions}>
                    <button style={S.previewChangeBtn} onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>📁 Change</button>
                    <button style={S.previewRemoveBtn} onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}>✕ Remove</button>
                  </div>
                </div>
              )}
            </div>

            {error && <div style={S.errorBox}>⚠️ {error}</div>}

            <button style={{ ...S.detectBtn, ...(!file || loading ? S.detectBtnOff : {}) }}
              disabled={!file || loading} onClick={handleDetect}>
              {loading
                ? <><span style={S.btnSpinner} /><span>{t("detecting")}</span></>
                : <>🔬 <span>{t("detect_btn")}</span></>}
            </button>

            <div style={S.statsRow}>
              {[
                { icon: "🌾", val: "38",   label: lang === "hi" ? "रोग वर्ग"   : "Disease Classes" },
                { icon: "🎯", val: "99%+", label: lang === "hi" ? "सटीकता"     : "Accuracy" },
                { icon: "⚡", val: "<2s",  label: lang === "hi" ? "निदान समय"  : "Diagnosis Time" },
                { icon: "🌍", val: "14",   label: lang === "hi" ? "फसल प्रकार" : "Crop Types" },
              ].map((s) => (
                <div key={s.label} style={S.statCard}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={S.statVal}>{s.val}</div>
                  <div style={S.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={S.cropsSection}>
              <div style={S.cropsSectionTitle}>{t("supported_crops")}</div>
              <div style={S.cropsGrid}>
                {["🍎 Apple","🫐 Blueberry","🍒 Cherry","🌽 Corn","🍇 Grape",
                  "🍊 Orange","🍑 Peach","🫑 Pepper","🥔 Potato","🍓 Strawberry",
                  "🍅 Tomato","🌿 Soybean","🎃 Squash","🍋 Raspberry"].map((c) => (
                  <div key={c} style={S.cropChip}>{c}</div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* RESULT SCREEN */}
        {screen === "result" && result && (() => {
          const sev  = SEVERITY_CONFIG[result.disease_info.severity] || SEVERITY_CONFIG.Unknown;
          const conf = result.diagnosis.top_prediction.confidence;
          const confColor = conf > 80 ? "#4ade80" : conf > 60 ? "#fbbf24" : "#f87171";
          return (
            <main style={S.resultMain}>
              <div style={S.resultTopBar}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button style={S.backBtn} onClick={reset}>{t("new_scan")}</button>
                  {isOfflineResult && <OfflineBadge inferenceMs={result?.inference_ms} />}
                </div>
                <div style={{ ...S.severityPill, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>
                  {sev.icon} {sev.label}
                </div>
              </div>

              <div style={S.resultGrid} className="result-grid">
                {/* LEFT */}
                <div style={S.resultLeft}>
                  <div style={S.leafCard}>
                    {/* Show heatmap overlay or original image */}
                    <img
                      src={showGradcam && gradcam?.overlay_image ? gradcam.overlay_image : preview}
                      alt="leaf"
                      style={S.leafImg}
                    />
                      <div style={S.leafCardOverlay}>
                        <span style={S.leafCardLabel}>
                          {result.diagnosis.is_healthy
                            ? (lang === "hi" ? "✅ स्वस्थ पौधा" : "✅ Healthy Plant")
                            : (lang === "hi" ? "🔬 रोग पाया गया" : "🔬 Disease Detected")}
                        </span>
                      </div>
                      {/* Grad-CAM toggle button */}
                      {!result.diagnosis.is_healthy && (
                        <div style={GC.btnRow}>
                          {!gradcam ? (
                            <button
                              style={GC.gradcamBtn}
                              onClick={fetchGradcam}
                              disabled={gradcamLoading}>
                              {gradcamLoading
                                ? <><span style={S.btnSpinner} /> Analyzing...</>
                                : "🔥 Show AI Heatmap"}
                            </button>
                          ) : (
                            <button
                              style={{
                                ...GC.gradcamBtn,
                                background: showGradcam
                                  ? "rgba(239,68,68,0.2)"
                                  : "rgba(74,222,128,0.12)",
                                border: showGradcam
                                  ? "1px solid rgba(239,68,68,0.4)"
                                  : "1px solid rgba(74,222,128,0.3)",
                                color: showGradcam ? "#f87171" : "#86efac",
                              }}
                              onClick={() => setShowGradcam(v => !v)}>
                              {showGradcam ? "🖼️ Show Original" : "🔥 Show AI Heatmap"}
                            </button>
                          )}
                        </div>
                      )}
 
                      {/* Grad-CAM description */}
                      {showGradcam && gradcam && (
                        <div style={GC.descBox}>
                          🔴 Red/yellow = disease focus area &nbsp;·&nbsp; 🔵 Blue = less relevant
                        </div>
                      )}
                  </div>

                  <div style={S.diagCard}>
                    <div style={S.diagLabel}>{t("primary_diagnosis")}</div>
                    <div style={S.diagDisease}>{translateDisease(result.diagnosis.top_prediction.display_name)}</div>
                    <div style={S.confRow}>
                      <span style={S.confText}>{t("confidence")}</span>
                      <span style={{ ...S.confValue, color: confColor }}>{conf}%</span>
                    </div>
                    <div style={S.confTrack}>
                      <div style={{ ...S.confFill, width: `${conf}%`, background: `linear-gradient(90deg, ${confColor}88, ${confColor})` }} />
                    </div>
                    <div style={S.confLevel}>
                      {conf > 80 ? "✅ " + t("high_confidence")
                        : conf > 60 ? "⚠️ " + t("medium_confidence")
                        : "❓ " + t("low_confidence")}
                    </div>
                    <button
                      style={S.voiceBtn}
                      onClick={() => speakDiagnosis(result, lang)}
                      title={lang === "hi" ? "उपचार को बोलें" : "Read Treatment Aloud"}>
                      🔊 {lang === "hi" ? "सुनें" : "Read Aloud"}
                    </button>
                  </div>

                  <div style={S.altCard}>
                    <div style={S.altTitle}>{t("other_possibilities")}</div>
                    {result.diagnosis.all_predictions.slice(1).map((p) => (
                      <div key={p.class_id} style={S.altRow}>
                        <span style={S.altName}>{p.display_name}</span>
                        <div style={S.altBarWrap}><div style={{ ...S.altBar, width: `${p.confidence}%` }} /></div>
                        <span style={S.altConf}>{p.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div style={S.resultRight}>
                  <div style={S.infoCard}>
                    <div style={S.infoCardHeader}>
                      <span style={{ fontSize: 18 }}>📋</span>
                      <span style={S.infoCardTitle}>{t("about_disease")}</span>
                    </div>
                    <p style={S.infoCardDesc}>{result.disease_info.description}</p>
                    {result.disease_info.symptoms?.length > 0 && (
                      <div style={S.infoSection}>
                        <div style={S.infoSectionTitle}>🔍 {t("symptoms")}</div>
                        {result.disease_info.symptoms.map((s, i) => (
                          <div key={i} style={S.infoItem}><span style={S.infoItemDot}>▸</span><span>{s}</span></div>
                        ))}
                      </div>
                    )}
                    <div style={S.infoSection}>
                      <div style={S.infoSectionTitle}>🧫 {t("causes")}</div>
                      <p style={S.infoCardDesc}>{result.disease_info.causes}</p>
                    </div>
                  </div>

                  <div style={S.treatCard}>
                    <div style={S.infoCardHeader}>
                      <span style={{ fontSize: 18 }}>💊</span>
                      <span style={S.infoCardTitle}>{t("treatment_options")}</span>
                    </div>
                    <div style={S.tabs} className="tabs">
                      {[
                        { id: "organic",    label: "🌿 " + t("organic") },
                        { id: "chemical",   label: "⚗️ " + t("chemical") },
                        { id: "prevention", label: "🛡️ " + t("prevention") },
                      ].map((tab) => (
                        <button key={tab.id}
                          style={{ ...S.tab, ...(activeTab === tab.id ? S.tabActive : {}) }}
                          onClick={() => setActiveTab(tab.id)}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div style={S.treatList}>
                      {(activeTab === "organic"     ? result.disease_info.organic_treatment
                        : activeTab === "chemical"  ? result.disease_info.chemical_treatment
                        : result.disease_info.prevention)?.map((item, i) => (
                        <div key={i} style={S.treatItem}>
                          <span style={S.treatNum}>{i + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <WeatherWidget disease={result.diagnosis.top_prediction.class_id} />

                  <CropCalendar
                    diseaseClassId={result.diagnosis.top_prediction.class_id}
                    lang={lang}
                  />

                  <DiseaseStages
                    diseaseClassId={result.diagnosis.top_prediction.class_id}
                    lang={lang}
                  />

                  <div style={S.disclaimer}>⚠️ {t("disclaimer_text")}</div>

                  <button style={S.scanAgainBtn} onClick={reset}>{t("scan_another")}</button>

                  <button
                    style={{ ...S.scanAgainBtn, marginTop: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", width: "100%" }}
                    onClick={() => exportDiagnosisPDF(result, preview, lang)}>
                    📄 {lang === "hi" ? "PDF रिपोर्ट डाउनलोड करें" : "Download PDF Report"}
                  </button>

                  <button
                    style={{
                      ...S.scanAgainBtn,
                      marginTop: 8,
                      background: "rgba(37,211,102,0.08)",
                      border: "1px solid rgba(37,211,102,0.3)",
                      color: "#25d366",
                    }}
                    onClick={() => shareOnWhatsApp(result, lang)}>
                    📱 {lang === "hi" ? "WhatsApp पर शेयर करें" : "Share on WhatsApp"}
                  </button>

                  <button
                    style={{ ...S.scanAgainBtn, marginTop: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
                    onClick={() => setShowAddToPlant(true)}>
                    📊 {lang === "hi" ? "प्रगति ट्रैक करें" : "Track Progression"}
                  </button>

                  {/* ✅ FIX: CommunityReportButton is here — in result screen, after scan */}
                  <CommunityReportButton result={result} lang={lang} />

                </div>
              </div>
            </main>
          );
        })()}

        {/* PROGRESSION SCREEN */}
        {/* ✅ FIX: CommunityReportButton removed from here */}
        {screen === "progression" && (
          <main style={{paddingBottom:40}}>
            <ProgressionTracker onClose={() => setScreen("home")} />
          </main>
        )}

        {/* MAP SCREEN */}
        {screen === "map" && (
          <main style={{paddingBottom:40}}>
            <OutbreakMap />
          </main>
        )}

        <footer style={S.footer}>DTI Project · AI-Based Plant Disease Detection · EfficientNet-B3 · Bennett University · 2026</footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050e07; overflow-x: hidden; }
        .clickable { cursor: pointer; }
        .clickable:hover { opacity: 0.85; transition: opacity 0.2s; }
        @keyframes floatUp { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 10%{opacity:0.5} 90%{opacity:0.2} 100%{transform:translateY(-10vh) rotate(360deg);opacity:0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.9)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 768px) {
          .result-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2,1fr) !important; }
          .crops-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 480px) {
          .crops-grid { grid-template-columns: repeat(2,1fr) !important; }
          .tabs { flex-wrap: wrap; }
        }
      `}</style>

      {showAddToPlant && result && (
        <AddToPlantModal
          result={result}
          onSave={() => setShowAddToPlant(false)}
          onClose={() => setShowAddToPlant(false)}
        />
      )}
    </div>
  );
}

const S = {
  userProfile: { display:"flex", alignItems:"center", gap:8, background:"rgba(22,163,74,0.12)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:20, padding:"4px 12px 4px 4px" },
  userAvatar: { width:28, height:28, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(74,222,128,0.4)" },
  userName: { fontSize:13, color:"#a7f3d0", fontWeight:600, maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  signOutBtn: { background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, fontWeight:700, padding:0, lineHeight:1 },
  root: { minHeight:"100vh", background:"linear-gradient(160deg,#050e07 0%,#071a0b 40%,#050e07 100%)", fontFamily:"'Cabinet Grotesk',sans-serif", color:"#e2f5e6", position:"relative", overflowX:"hidden" },
  noise: { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", opacity:0.4 },
  particles: { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" },
  particle: { position:"absolute", bottom:"-10%", fontSize:20, opacity:0, animation:"floatUp 12s ease-in-out infinite" },
  app: { position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"0 20px 40px" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"24px 0 20px", borderBottom:"1px solid rgba(74,222,128,0.1)", marginBottom:32, flexWrap:"wrap", gap:12 },
  headerLeft: { display:"flex", alignItems:"center", gap:14 },
  logoMark: { width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#166534,#15803d)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 0 20px rgba(22,163,74,0.4)" },
  logoName: { fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:700, color:"#f0fdf4", letterSpacing:"-0.5px" },
  logoAI: { color:"#4ade80" },
  logoTagline: { fontSize:11, color:"#6ee7b7", letterSpacing:"0.1em", textTransform:"uppercase" },
  headerRight: { display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" },
  modelBadge: { display:"flex", alignItems:"center", gap:6, background:"rgba(22,163,74,0.12)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#86efac", fontWeight:500 },
  modelDot: { width:7, height:7, borderRadius:"50%", background:"#4ade80", animation:"pulse 2s ease-in-out infinite", display:"inline-block" },
  historyBtn: { display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"7px 14px", fontSize:13, color:"#a7f3d0", cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500 },
  historyBtnActive: { background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.35)", color:"#4ade80" },
  historyCount: { background:"#16a34a", color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:11, fontWeight:700 },
  historyPanel: { background:"rgba(10,30,15,0.95)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:16, padding:"20px", marginBottom:24, backdropFilter:"blur(20px)", animation:"fadeUp 0.3s ease forwards" },
  historyHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  historyTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:600, color:"#bbf7d0" },
  clearBtn: { background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif" },
  historyEmpty: { textAlign:"center", color:"#6ee7b7", fontSize:14, padding:"20px 0", opacity:0.7 },
  historyList: { display:"flex", flexDirection:"column", gap:10, maxHeight:340, overflowY:"auto" },
  historyItem: { display:"flex", gap:14, alignItems:"center", background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"12px", border:"1px solid rgba(255,255,255,0.07)" },
  historyThumb: { width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0 },
  historyItemInfo: { flex:1, minWidth:0 },
  historyItemDisease: { fontSize:14, fontWeight:600, color:"#d1fae5", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  historyItemMeta: { display:"flex", gap:12, fontSize:12, marginBottom:3 },
  historyItemConf: { color:"#6ee7b7", fontWeight:600 },
  historyItemTime: { fontSize:11, color:"#4b7a57" },
  main: { paddingBottom:40 },
  hero: { textAlign:"center", padding:"16px 0 36px", maxWidth:700, margin:"0 auto" },
  heroEyebrow: { display:"inline-block", background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:20, padding:"5px 16px", fontSize:12, color:"#86efac", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:20 },
  h1: { fontFamily:"'Clash Display',sans-serif", fontSize:"clamp(34px,5.5vw,58px)", fontWeight:700, lineHeight:1.08, color:"#f0fdf4", marginBottom:20, letterSpacing:"-1px" },
  h1Gradient: { background:"linear-gradient(135deg,#4ade80 0%,#22c55e 50%,#86efac 100%)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 4s linear infinite" },
  heroSub: { fontSize:16, color:"#a7f3d0", lineHeight:1.75, fontWeight:400, maxWidth:580, margin:"0 auto" },
  uploadZone: { border:"2px dashed rgba(74,222,128,0.3)", borderRadius:24, background:"rgba(10,40,18,0.5)", backdropFilter:"blur(16px)", minHeight:280, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s ease", marginBottom:20, overflow:"hidden" },
  uploadZoneActive: { border:"2px dashed #4ade80", background:"rgba(74,222,128,0.08)", transform:"scale(1.01)", boxShadow:"0 0 40px rgba(74,222,128,0.15)" },
  uploadZonePreview: { border:"2px solid rgba(74,222,128,0.35)", cursor:"default", minHeight:340 },
  uploadContent: { textAlign:"center", padding:44 },
  uploadIconRing: { width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,rgba(22,163,74,0.25),rgba(74,222,128,0.1))", border:"2px solid rgba(74,222,128,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" },
  uploadTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:600, color:"#d1fae5", marginBottom:8 },
  uploadSub: { fontSize:14, color:"#6ee7b7", marginBottom:16 },
  uploadFormats: { display:"inline-block", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:8, padding:"4px 12px", fontSize:12, color:"#86efac", marginBottom:12 },
  uploadPrivacy: { fontSize:12, color:"#4b7a57" },
  previewContainer: { position:"relative", width:"100%" },
  previewImg: { width:"100%", maxHeight:400, objectFit:"contain", borderRadius:20, display:"block" },
  previewActions: { position:"absolute", bottom:14, right:14, display:"flex", gap:8 },
  previewChangeBtn: { background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", borderRadius:10, padding:"8px 14px", fontSize:13, cursor:"pointer", backdropFilter:"blur(10px)", fontFamily:"'Cabinet Grotesk',sans-serif" },
  previewRemoveBtn: { background:"rgba(220,38,38,0.6)", border:"1px solid rgba(239,68,68,0.4)", color:"#fff", borderRadius:10, padding:"8px 12px", fontSize:13, cursor:"pointer", backdropFilter:"blur(10px)", fontFamily:"'Cabinet Grotesk',sans-serif" },
  errorBox: { background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"13px 16px", color:"#fca5a5", fontSize:14, marginBottom:16 },
  detectBtn: { width:"100%", padding:"18px 24px", borderRadius:16, border:"none", background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", fontFamily:"'Clash Display',sans-serif", fontSize:18, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 4px 24px rgba(22,163,74,0.35)" },
  detectBtnOff: { opacity:0.4, cursor:"not-allowed", boxShadow:"none" },
  btnSpinner: { width:20, height:20, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.8s linear infinite", display:"inline-block" },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:28 },
  statCard: { background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.12)", borderRadius:16, padding:"20px 12px", textAlign:"center", backdropFilter:"blur(10px)" },
  statVal: { fontFamily:"'Clash Display',sans-serif", fontSize:26, fontWeight:700, color:"#4ade80", marginBottom:4 },
  statLabel: { fontSize:12, color:"#6ee7b7", fontWeight:500 },
  cropsSection: { marginTop:36 },
  cropsSectionTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:15, fontWeight:600, color:"#86efac", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.08em" },
  cropsGrid: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8 },
  cropChip: { background:"rgba(22,163,74,0.1)", border:"1px solid rgba(74,222,128,0.18)", borderRadius:10, padding:"8px 6px", fontSize:12, color:"#a7f3d0", textAlign:"center", fontWeight:500, whiteSpace:"nowrap" },
  resultMain: { paddingBottom:40 },
  resultTopBar: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 },
  backBtn: { background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.25)", color:"#86efac", borderRadius:10, padding:"9px 18px", fontSize:14, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500 },
  severityPill: { borderRadius:20, padding:"8px 20px", fontSize:14, fontWeight:700 },
  resultGrid: { display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:20, alignItems:"start" },
  resultLeft: { display:"flex", flexDirection:"column", gap:16 },
  resultRight: { display:"flex", flexDirection:"column", gap:16 },
  leafCard: { borderRadius:20, overflow:"hidden", border:"1px solid rgba(74,222,128,0.2)", position:"relative", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" },
  leafImg: { width:"100%", maxHeight:280, objectFit:"cover", display:"block" },
  leafCardOverlay: { position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)", padding:"20px 16px 14px" },
  leafCardLabel: { fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.04em" },
  diagCard: { background:"rgba(10,40,18,0.7)", border:"1px solid rgba(74,222,128,0.18)", borderRadius:18, padding:"20px", backdropFilter:"blur(16px)" },
  diagLabel: { fontSize:10, fontWeight:700, color:"#4ade80", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 },
  diagDisease: { fontFamily:"'Clash Display',sans-serif", fontSize:20, fontWeight:700, color:"#f0fdf4", lineHeight:1.3, marginBottom:16 },
  confRow: { display:"flex", justifyContent:"space-between", marginBottom:8 },
  confText: { fontSize:13, color:"#6ee7b7" },
  confValue: { fontSize:15, fontWeight:700 },
  confTrack: { height:8, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden", marginBottom:10 },
  confFill: { height:"100%", borderRadius:4, transition:"width 1s ease" },
  confLevel: { fontSize:12, color:"#6ee7b7", lineHeight:1.5 },
  altCard: { background:"rgba(5,20,8,0.8)", border:"1px solid rgba(74,222,128,0.1)", borderRadius:16, padding:"16px" },
  altTitle: { fontSize:11, fontWeight:700, color:"#4b7a57", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 },
  altRow: { display:"flex", alignItems:"center", gap:8, marginBottom:10 },
  altName: { fontSize:12, color:"#a7f3d0", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  altBarWrap: { width:60, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" },
  altBar: { height:"100%", background:"rgba(74,222,128,0.5)", borderRadius:2 },
  altConf: { fontSize:12, color:"#4ade80", fontWeight:600, width:36, textAlign:"right" },
  infoCard: { background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:18, padding:"20px", backdropFilter:"blur(16px)" },
  infoCardHeader: { display:"flex", alignItems:"center", gap:10, marginBottom:14 },
  infoCardTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:"#bbf7d0" },
  infoCardDesc: { fontSize:13, color:"#a7f3d0", lineHeight:1.7, marginBottom:4 },
  infoSection: { marginTop:14 },
  infoSectionTitle: { fontSize:11, fontWeight:700, color:"#4ade80", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 },
  infoItem: { display:"flex", gap:8, fontSize:13, color:"#a7f3d0", lineHeight:1.6, marginBottom:6 },
  infoItemDot: { color:"#4ade80", flexShrink:0, fontWeight:700 },
  treatCard: { background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:18, padding:"20px", backdropFilter:"blur(16px)" },
  tabs: { display:"flex", gap:8, marginBottom:18 },
  tab: { padding:"8px 16px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", background:"transparent", color:"#6ee7b7", fontSize:13, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500 },
  tabActive: { background:"rgba(74,222,128,0.18)", border:"1px solid rgba(74,222,128,0.45)", color:"#bbf7d0", fontWeight:700 },
  treatList: { display:"flex", flexDirection:"column", gap:10 },
  treatItem: { display:"flex", gap:12, alignItems:"flex-start", fontSize:13, color:"#a7f3d0", lineHeight:1.65 },
  treatNum: { width:22, height:22, borderRadius:"50%", background:"rgba(74,222,128,0.2)", color:"#4ade80", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
  disclaimer: { background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:12, padding:"13px 16px", fontSize:12, color:"#fde68a", lineHeight:1.65 },
  scanAgainBtn: { width:"100%", padding:"15px", borderRadius:14, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.08)", color:"#86efac", fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:600, cursor:"pointer" },
  voiceBtn: { width:"100%", marginTop:12, padding:"10px", borderRadius:10, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.08)", color:"#86efac", fontSize:14, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  footer: { textAlign:"center", padding:"24px 0 8px", borderTop:"1px solid rgba(74,222,128,0.08)", marginTop:40, fontSize:11, color:"rgba(110,231,183,0.3)", letterSpacing:"0.04em" },
};

const GC = {
  btnRow: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    padding: "0 12px",
  },
  gradcamBtn: {
    background: "rgba(74,222,128,0.12)",
    border: "1px solid rgba(74,222,128,0.3)",
    color: "#86efac",
    borderRadius: 10,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Cabinet Grotesk',sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
    backdropFilter: "blur(10px)",
    transition: "all 0.2s ease",
  },
  descBox: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}