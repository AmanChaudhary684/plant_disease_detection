// IoTSimulator.jsx — IoT Sensor Simulation for LeafDoc AI
// DTI Project | Innovation #4 | Simulates Raspberry Pi sensor data
// Sensors: DHT22 (temp+humidity), Soil moisture, Light, CO2

import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Sensor simulation logic ───────────────────────────────────────────────────
const CROP_PROFILES = {
  "Tomato":   { temp: [22, 30], humidity: [65, 85], soil: [45, 70], light: [6000, 9000], co2: [380, 450] },
  "Potato":   { temp: [15, 22], humidity: [70, 90], soil: [55, 75], light: [5000, 8000], co2: [380, 440] },
  "Apple":    { temp: [18, 26], humidity: [60, 80], soil: [40, 65], light: [7000, 10000], co2: [370, 430] },
  "Corn":     { temp: [24, 32], humidity: [55, 75], soil: [40, 60], light: [8000, 12000], co2: [380, 460] },
  "Grape":    { temp: [20, 28], humidity: [60, 78], soil: [35, 55], light: [7000, 11000], co2: [375, 445] },
  "Pepper":   { temp: [24, 32], humidity: [65, 85], soil: [50, 70], light: [6000, 9000], co2: [380, 450] },
  "Potato":   { temp: [15, 22], humidity: [70, 90], soil: [55, 75], light: [5000, 8000], co2: [380, 440] },
  "Wheat":    { temp: [18, 25], humidity: [55, 75], soil: [40, 60], light: [6000, 9000], co2: [370, 430] },
};

const DISEASE_RISK_RULES = [
  { name: "Late Blight Risk",    condition: (s) => s.humidity > 85 && s.temp < 20,              level: "Critical", color: "#ef4444", tip: "Apply Ridomil Gold MZ preventively — Late Blight thrives in cool humid conditions." },
  { name: "Early Blight Risk",   condition: (s) => s.humidity > 75 && s.temp > 25,              level: "High",     color: "#f97316", tip: "Apply Mancozeb spray — warm humid nights favor Early Blight spore germination." },
  { name: "Powdery Mildew Risk", condition: (s) => s.humidity > 70 && s.humidity < 85 && s.temp > 22, level: "High", color: "#f97316", tip: "Apply sulfur fungicide — Powdery Mildew thrives in warm moderately humid conditions." },
  { name: "Bacterial Spot Risk", condition: (s) => s.humidity > 80 && s.temp > 24,              level: "High",     color: "#f97316", tip: "Apply copper bactericide — bacteria spread rapidly in warm wet conditions." },
  { name: "Spider Mite Risk",    condition: (s) => s.humidity < 45 && s.temp > 28,              level: "High",     color: "#f97316", tip: "Spray leaf undersides with water — mites thrive in hot dry conditions." },
  { name: "Fungal Risk",         condition: (s) => s.humidity > 80,                             level: "Moderate", color: "#eab308", tip: "Improve ventilation and apply preventive copper spray." },
  { name: "Optimal Conditions",  condition: (s) => s.humidity >= 50 && s.humidity <= 70 && s.temp >= 20 && s.temp <= 28, level: "Low", color: "#22c55e", tip: "Current conditions are favorable for healthy plant growth." },
];

const SENSOR_CONFIGS = [
  { id: "temp",     label: "Temperature",   unit: "°C",   icon: "🌡️", min: 10, max: 45, decimals: 1, color: "#f97316" },
  { id: "humidity", label: "Humidity",      unit: "%",    icon: "💧", min: 20, max: 100, decimals: 0, color: "#60a5fa" },
  { id: "soil",     label: "Soil Moisture", unit: "%",    icon: "🌱", min: 10, max: 100, decimals: 0, color: "#4ade80" },
  { id: "light",    label: "Light (Lux)",   unit: " lux", icon: "☀️", min: 0, max: 15000, decimals: 0, color: "#fbbf24" },
  { id: "co2",      label: "CO₂",           unit: " ppm", icon: "💨", min: 350, max: 600, decimals: 0, color: "#a78bfa" },
];

function generateSensorValue(profile, sensorId, prev, variance = 0.03) {
  const [min, max] = profile[sensorId];
  const center = (min + max) / 2;
  const noise  = (Math.random() - 0.5) * (max - min) * variance;
  const newVal = prev ? prev + noise : center + (Math.random() - 0.5) * (max - min) * 0.3;
  return Math.max(min * 0.9, Math.min(max * 1.1, newVal));
}

export default function IoTSimulator({ lang }) {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [isRunning, setIsRunning]       = useState(false);
  const [sensors, setSensors]           = useState(null);
  const [history, setHistory]           = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [deviceId]                      = useState(`RPi-${Math.random().toString(36).substr(2,6).toUpperCase()}`);
  const [uptime, setUptime]             = useState(0);
  const [readingCount, setReadingCount] = useState(0);
  const [weatherRisk, setWeatherRisk]   = useState(null);
  const intervalRef = useRef(null);
  const uptimeRef   = useRef(null);

  const profile = CROP_PROFILES[selectedCrop] || CROP_PROFILES["Tomato"];

  // ── Start/Stop simulation ──────────────────────────────────────────────────
  const startSimulation = () => {
    setIsRunning(true);
    setHistory([]);
    setReadingCount(0);
    setUptime(0);

    // Initial reading
    const initial = {
      temp:     generateSensorValue(profile, 'temp', null),
      humidity: generateSensorValue(profile, 'humidity', null),
      soil:     generateSensorValue(profile, 'soil', null),
      light:    generateSensorValue(profile, 'light', null),
      co2:      generateSensorValue(profile, 'co2', null),
      ts:       Date.now(),
    };
    setSensors(initial);
    evaluateRisk(initial);

    // Update every 3 seconds
    intervalRef.current = setInterval(() => {
      setSensors(prev => {
        if (!prev) return prev;
        const next = {
          temp:     generateSensorValue(profile, 'temp',     prev.temp,     0.02),
          humidity: generateSensorValue(profile, 'humidity', prev.humidity, 0.02),
          soil:     generateSensorValue(profile, 'soil',     prev.soil,     0.015),
          light:    generateSensorValue(profile, 'light',    prev.light,    0.04),
          co2:      generateSensorValue(profile, 'co2',      prev.co2,      0.02),
          ts:       Date.now(),
        };
        setHistory(h => [...h.slice(-19), next]);
        setReadingCount(c => c + 1);
        evaluateRisk(next);
        return next;
      });
    }, 3000);

    // Uptime counter
    uptimeRef.current = setInterval(() => setUptime(u => u + 1), 1000);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    clearInterval(uptimeRef.current);
  };

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearInterval(uptimeRef.current);
  }, []);

  // ── Evaluate disease risk from sensor data ────────────────────────────────
  const evaluateRisk = (s) => {
    const triggered = DISEASE_RISK_RULES.filter(r => r.condition(s));
    setAlerts(triggered.slice(0, 3));
  };

  // ── Fetch real weather risk from backend ──────────────────────────────────
  const fetchWeatherRisk = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/weather/risk?city=Delhi&disease=`);
      const data = await res.json();
      if (data.success) setWeatherRisk(data.disease_risk);
    } catch {}
  };

  useEffect(() => { if (isRunning) fetchWeatherRisk(); }, [isRunning]);

  const formatUptime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2,'0')}s`;
  };

  const getSoilStatus = (val) => {
    if (val < 30) return { label: "Dry — Water needed", color: "#ef4444" };
    if (val < 50) return { label: "Low moisture",       color: "#f97316" };
    if (val < 70) return { label: "Optimal",            color: "#4ade80" };
    return              { label: "Wet — Reduce water",  color: "#60a5fa" };
  };

  const getLightStatus = (val) => {
    if (val < 2000) return { label: "Very Low",  color: "#6b7280" };
    if (val < 5000) return { label: "Low",       color: "#f97316" };
    if (val < 8000) return { label: "Good",      color: "#4ade80" };
    return               { label: "Excellent",   color: "#fbbf24" };
  };

  return (
    <div style={I.root}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={I.header}>
        <div style={I.headerLeft}>
          <div style={I.headerIcon}>🤖</div>
          <div>
            <div style={I.headerTitle}>
              {lang === "hi" ? "IoT सेंसर सिमुलेशन" : "IoT Sensor Simulation"}
            </div>
            <div style={I.headerSub}>
              Raspberry Pi 4B · DHT22 · Soil Sensor · LDR · MQ-135
            </div>
          </div>
        </div>
        <div style={I.headerBadge}>Innovation #4</div>
      </div>

      {/* ── Device Info Bar ───────────────────────────────────────────────── */}
      <div style={I.deviceBar}>
        <div style={I.deviceItem}>
          <span style={I.deviceIcon}>📡</span>
          <span style={I.deviceLabel}>Device:</span>
          <span style={I.deviceVal}>{deviceId}</span>
        </div>
        <div style={I.deviceItem}>
          <span style={I.deviceIcon}>🌿</span>
          <span style={I.deviceLabel}>Crop:</span>
          <span style={I.deviceVal}>{selectedCrop}</span>
        </div>
        <div style={I.deviceItem}>
          <span style={I.deviceIcon}>⏱️</span>
          <span style={I.deviceLabel}>Uptime:</span>
          <span style={I.deviceVal}>{formatUptime(uptime)}</span>
        </div>
        <div style={I.deviceItem}>
          <span style={I.deviceIcon}>📊</span>
          <span style={I.deviceLabel}>Readings:</span>
          <span style={I.deviceVal}>{readingCount}</span>
        </div>
        <div style={{
          ...I.statusDot,
          background: isRunning ? "#4ade80" : "#6b7280",
          boxShadow: isRunning ? "0 0 8px #4ade80" : "none",
        }} />
        <span style={{ fontSize: 12, color: isRunning ? "#4ade80" : "#6b7280", fontWeight: 700 }}>
          {isRunning ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={I.controls}>
        <div style={I.cropSelector}>
          <label style={I.cropLabel}>
            🌾 {lang === "hi" ? "फसल चुनें:" : "Select Crop:"}
          </label>
          <select
            value={selectedCrop}
            onChange={e => { setSelectedCrop(e.target.value); if (isRunning) stopSimulation(); }}
            style={I.cropSelect}>
            {Object.keys(CROP_PROFILES).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          style={{ ...I.startBtn, ...(isRunning ? I.stopBtn : {}) }}
          onClick={isRunning ? stopSimulation : startSimulation}>
          {isRunning ? "⏹ Stop Sensors" : "▶ Start Sensors"}
        </button>
      </div>

      {/* ── Sensor Cards ──────────────────────────────────────────────────── */}
      {sensors && (
        <div style={I.sensorGrid}>
          {SENSOR_CONFIGS.map(cfg => {
            const val = sensors[cfg.id];
            const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100;
            let status = null;
            if (cfg.id === 'soil')  status = getSoilStatus(val);
            if (cfg.id === 'light') status = getLightStatus(val);

            return (
              <div key={cfg.id} style={I.sensorCard}>
                <div style={I.sensorHeader}>
                  <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                  <span style={I.sensorLabel}>{cfg.label}</span>
                  {/* Live pulse */}
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: cfg.color,
                    animation: "pulse 1.5s ease-in-out infinite",
                    marginLeft: "auto",
                  }} />
                </div>
                <div style={{ ...I.sensorValue, color: cfg.color }}>
                  {cfg.id === 'temp'     ? val.toFixed(1) :
                   cfg.id === 'light'    ? Math.round(val).toLocaleString() :
                   Math.round(val)}
                  <span style={I.sensorUnit}>{cfg.unit}</span>
                </div>
                {/* Progress bar */}
                <div style={I.sensorBar}>
                  <div style={{
                    ...I.sensorBarFill,
                    width: `${Math.max(2, Math.min(100, pct))}%`,
                    background: cfg.color,
                  }} />
                </div>
                {status && (
                  <div style={{ ...I.sensorStatus, color: status.color }}>
                    {status.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Risk Alerts ───────────────────────────────────────────────────── */}
      {alerts.length > 0 && sensors && (
        <div style={I.alertsSection}>
          <div style={I.alertsTitle}>
            🚨 {lang === "hi" ? "रोग जोखिम चेतावनी" : "Disease Risk Alerts"}
          </div>
          {alerts.map((alert, i) => (
            <div key={i} style={{
              ...I.alertCard,
              borderColor: alert.color,
              background: `${alert.color}12`,
            }}>
              <div style={I.alertHeader}>
                <span style={{ ...I.alertLevel, color: alert.color, borderColor: alert.color }}>
                  {alert.level}
                </span>
                <span style={{ ...I.alertName, color: alert.color }}>{alert.name}</span>
              </div>
              <p style={I.alertTip}>💡 {alert.tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Mini History Chart ────────────────────────────────────────────── */}
      {history.length > 3 && (
        <div style={I.historySection}>
          <div style={I.historyTitle}>
            📈 {lang === "hi" ? "लाइव सेंसर ट्रेंड (अंतिम 20 रीडिंग)" : "Live Sensor Trend (Last 20 readings)"}
          </div>
          <div style={I.historyChart}>
            {/* Temperature sparkline */}
            {["temp", "humidity"].map(key => {
              const cfg   = SENSOR_CONFIGS.find(c => c.id === key);
              const vals  = history.map(h => h[key]);
              const min   = Math.min(...vals);
              const max   = Math.max(...vals);
              const range = max - min || 1;
              return (
                <div key={key} style={I.sparklineRow}>
                  <span style={{ ...I.sparklineLabel, color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <div style={I.sparkline}>
                    <svg width="100%" height="40" viewBox={`0 0 ${history.length * 10} 40`}
                         preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="1.5"
                        points={vals.map((v, i) => (
                          `${i * 10},${40 - ((v - min) / range) * 35}`
                        )).join(' ')}
                      />
                    </svg>
                  </div>
                  <span style={{ ...I.sparklineVal, color: cfg.color }}>
                    {key === 'temp' ? sensors?.[key].toFixed(1) : Math.round(sensors?.[key])}{cfg.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── IoT Architecture Info ─────────────────────────────────────────── */}
      <div style={I.archSection}>
        <div style={I.archTitle}>
          🔧 {lang === "hi" ? "IoT आर्किटेक्चर" : "IoT Architecture"}
        </div>
        <div style={I.archFlow}>
          {[
            { icon: "🌡️", label: "DHT22\nTemp + Humidity" },
            { icon: "→", label: "" },
            { icon: "🌱", label: "Capacitive\nSoil Sensor" },
            { icon: "→", label: "" },
            { icon: "🤖", label: "Raspberry\nPi 4B" },
            { icon: "→", label: "" },
            { icon: "☁️", label: "LeafDoc AI\nBackend API" },
            { icon: "→", label: "" },
            { icon: "📱", label: "Farmer\nAlert" },
          ].map((item, i) => (
            <div key={i} style={I.archItem}>
              <div style={I.archIcon}>{item.icon}</div>
              {item.label && (
                <div style={I.archLabel}>
                  {item.label.split('\n').map((line, j) => (
                    <span key={j}>{line}<br/></span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={I.archNote}>
          📌 {lang === "hi"
            ? "वास्तविक Raspberry Pi सेंसर डेटा हर 5 मिनट में API को भेजता है और रोग जोखिम की गणना करता है।"
            : "Real Raspberry Pi sends sensor data every 5 minutes to the API which calculates disease risk automatically."}
        </div>
      </div>

      {/* ── Not running message ───────────────────────────────────────────── */}
      {!isRunning && !sensors && (
        <div style={I.notRunning}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 15, color: "#bbf7d0", fontWeight: 700, marginBottom: 6 }}>
            {lang === "hi" ? "IoT सेंसर तैयार है" : "IoT Sensors Ready"}
          </div>
          <div style={{ fontSize: 13, color: "#6ee7b7", lineHeight: 1.6 }}>
            {lang === "hi"
              ? "फसल चुनें और 'Start Sensors' दबाएं"
              : "Select your crop and press 'Start Sensors' to begin live monitoring"}
          </div>
        </div>
      )}

    </div>
  );
}

const I = {
  root: { fontFamily: "'Cabinet Grotesk',sans-serif", color: "#e2f5e6", paddingBottom: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(37,99,235,0.4)" },
  headerTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 18, fontWeight: 700, color: "#f0fdf4" },
  headerSub: { fontSize: 11, color: "#93c5fd", marginTop: 2 },
  headerBadge: { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 },
  deviceBar: { display: "flex", alignItems: "center", gap: 16, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, flexWrap: "wrap" },
  deviceItem: { display: "flex", alignItems: "center", gap: 5 },
  deviceIcon: { fontSize: 14 },
  deviceLabel: { fontSize: 11, color: "#6b7280" },
  deviceVal: { fontSize: 12, color: "#4ade80", fontWeight: 700, fontFamily: "monospace" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", marginLeft: "auto" },
  controls: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  cropSelector: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  cropLabel: { fontSize: 13, color: "#86efac", fontWeight: 600, whiteSpace: "nowrap" },
  cropSelect: { flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: "9px 12px", color: "#f0fdf4", fontSize: 13, fontFamily: "'Cabinet Grotesk',sans-serif", outline: "none" },
  startBtn: { padding: "10px 24px", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cabinet Grotesk',sans-serif", whiteSpace: "nowrap" },
  stopBtn: { background: "linear-gradient(135deg,#dc2626,#b91c1c)" },
  sensorGrid: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 },
  sensorCard: { background: "rgba(10,40,18,0.6)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, padding: "14px 12px", backdropFilter: "blur(10px)" },
  sensorHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 },
  sensorLabel: { fontSize: 10, color: "#6ee7b7", fontWeight: 600, flex: 1 },
  sensorValue: { fontFamily: "'Clash Display',sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 8 },
  sensorUnit: { fontSize: 11, fontWeight: 500, opacity: 0.7, marginLeft: 2 },
  sensorBar: { height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  sensorBarFill: { height: "100%", borderRadius: 2, transition: "width 0.8s ease" },
  sensorStatus: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  alertsSection: { marginBottom: 16 },
  alertsTitle: { fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" },
  alertCard: { border: "1px solid", borderRadius: 12, padding: "12px 14px", marginBottom: 8 },
  alertHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  alertLevel: { fontSize: 10, fontWeight: 800, border: "1px solid", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" },
  alertName: { fontSize: 13, fontWeight: 700 },
  alertTip: { fontSize: 12, color: "#a7f3d0", lineHeight: 1.6, margin: 0 },
  historySection: { background: "rgba(0,0,0,0.2)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 14, padding: "14px", marginBottom: 16 },
  historyTitle: { fontSize: 12, color: "#86efac", fontWeight: 700, marginBottom: 10 },
  historyChart: { display: "flex", flexDirection: "column", gap: 8 },
  sparklineRow: { display: "flex", alignItems: "center", gap: 10 },
  sparklineLabel: { fontSize: 11, fontWeight: 600, width: 110, flexShrink: 0 },
  sparkline: { flex: 1, height: 40, background: "rgba(0,0,0,0.2)", borderRadius: 6, overflow: "hidden" },
  sparklineVal: { fontSize: 12, fontWeight: 700, width: 55, textAlign: "right", flexShrink: 0 },
  archSection: { background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 14, padding: "16px" },
  archTitle: { fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 14 },
  archFlow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap", marginBottom: 12 },
  archItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  archIcon: { fontSize: 22 },
  archLabel: { fontSize: 9, color: "#93c5fd", textAlign: "center", lineHeight: 1.4 },
  archNote: { fontSize: 11, color: "#6ee7b7", lineHeight: 1.6, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 10px" },
  notRunning: { textAlign: "center", padding: "40px 20px", background: "rgba(0,0,0,0.2)", borderRadius: 14, border: "1px dashed rgba(74,222,128,0.2)" },
};