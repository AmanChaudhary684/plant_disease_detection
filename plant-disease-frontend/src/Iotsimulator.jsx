// IoTSimulator.jsx — LeafDoc AI
// DTI Project | Innovation #4 | White theme matching AppNew.jsx

import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CROP_PROFILES = {
  "Tomato":  { temp: [22, 30], humidity: [65, 85], soil: [45, 70], light: [6000, 9000],  co2: [380, 450] },
  "Potato":  { temp: [15, 22], humidity: [70, 90], soil: [55, 75], light: [5000, 8000],  co2: [380, 440] },
  "Apple":   { temp: [18, 26], humidity: [60, 80], soil: [40, 65], light: [7000, 10000], co2: [370, 430] },
  "Corn":    { temp: [24, 32], humidity: [55, 75], soil: [40, 60], light: [8000, 12000], co2: [380, 460] },
  "Grape":   { temp: [20, 28], humidity: [60, 78], soil: [35, 55], light: [7000, 11000], co2: [375, 445] },
  "Pepper":  { temp: [24, 32], humidity: [65, 85], soil: [50, 70], light: [6000, 9000],  co2: [380, 450] },
  "Wheat":   { temp: [18, 25], humidity: [55, 75], soil: [40, 60], light: [6000, 9000],  co2: [370, 430] },
};

const DISEASE_RISK_RULES = [
  { name: "Late Blight Risk",    condition: (s) => s.humidity > 85 && s.temp < 20,                              level: "Critical", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", tip: "Apply Ridomil Gold MZ preventively — Late Blight thrives in cool humid conditions." },
  { name: "Early Blight Risk",   condition: (s) => s.humidity > 75 && s.temp > 25,                              level: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fdba74", tip: "Apply Mancozeb spray — warm humid nights favor Early Blight spore germination." },
  { name: "Powdery Mildew Risk", condition: (s) => s.humidity > 70 && s.humidity < 85 && s.temp > 22,           level: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fdba74", tip: "Apply sulfur fungicide — Powdery Mildew thrives in warm moderately humid conditions." },
  { name: "Bacterial Spot Risk", condition: (s) => s.humidity > 80 && s.temp > 24,                              level: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fdba74", tip: "Apply copper bactericide — bacteria spread rapidly in warm wet conditions." },
  { name: "Spider Mite Risk",    condition: (s) => s.humidity < 45 && s.temp > 28,                              level: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fdba74", tip: "Spray leaf undersides with water — mites thrive in hot dry conditions." },
  { name: "Fungal Risk",         condition: (s) => s.humidity > 80,                                             level: "Moderate", color: "#ca8a04", bg: "#fefce8", border: "#fde047", tip: "Improve ventilation and apply preventive copper spray." },
  { name: "Optimal Conditions",  condition: (s) => s.humidity >= 50 && s.humidity <= 70 && s.temp >= 20 && s.temp <= 28, level: "Low", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", tip: "Current conditions are favorable for healthy plant growth." },
];

const SENSOR_CONFIGS = [
  { id: "temp",     label: "Temperature",   unit: "°C",   icon: "🌡️", min: 10,  max: 45,    decimals: 1, color: "#ea580c", bg: "#fff7ed" },
  { id: "humidity", label: "Humidity",      unit: "%",    icon: "💧", min: 20,  max: 100,   decimals: 0, color: "#2563eb", bg: "#eff6ff" },
  { id: "soil",     label: "Soil Moisture", unit: "%",    icon: "🌱", min: 10,  max: 100,   decimals: 0, color: "#16a34a", bg: "#f0fdf4" },
  { id: "light",    label: "Light (Lux)",   unit: " lux", icon: "☀️", min: 0,   max: 15000, decimals: 0, color: "#ca8a04", bg: "#fefce8" },
  { id: "co2",      label: "CO₂",           unit: " ppm", icon: "💨", min: 350, max: 600,   decimals: 0, color: "#7c3aed", bg: "#f5f3ff" },
];

function generateSensorValue(profile, sensorId, prev, variance = 0.03) {
  const [min, max] = profile[sensorId];
  const center = (min + max) / 2;
  const noise  = (Math.random() - 0.5) * (max - min) * variance;
  const newVal = prev ? prev + noise : center + (Math.random() - 0.5) * (max - min) * 0.3;
  return Math.max(min * 0.9, Math.min(max * 1.1, newVal));
}

const getSoilStatus  = (v) => v < 30 ? { label: "Dry — water needed", color: "#ef4444" } : v < 50 ? { label: "Low moisture", color: "#ea580c" } : v < 70 ? { label: "Optimal", color: "#16a34a" } : { label: "Wet — reduce water", color: "#2563eb" };
const getLightStatus = (v) => v < 2000 ? { label: "Very Low", color: "#6b7280" } : v < 5000 ? { label: "Low", color: "#ea580c" } : v < 8000 ? { label: "Good", color: "#16a34a" } : { label: "Excellent", color: "#ca8a04" };

export default function IoTSimulator({ lang }) {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [isRunning, setIsRunning]       = useState(false);
  const [sensors, setSensors]           = useState(null);
  const [history, setHistory]           = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [deviceId]                      = useState(`RPi-${Math.random().toString(36).substr(2,6).toUpperCase()}`);
  const [uptime, setUptime]             = useState(0);
  const [readingCount, setReadingCount] = useState(0);
  const intervalRef = useRef(null);
  const uptimeRef   = useRef(null);

  const profile = CROP_PROFILES[selectedCrop] || CROP_PROFILES["Tomato"];

  const evaluateRisk = (s) => setAlerts(DISEASE_RISK_RULES.filter(r => r.condition(s)).slice(0, 3));

  const startSimulation = () => {
    setIsRunning(true); setHistory([]); setReadingCount(0); setUptime(0);
    const initial = { temp: generateSensorValue(profile,"temp",null), humidity: generateSensorValue(profile,"humidity",null), soil: generateSensorValue(profile,"soil",null), light: generateSensorValue(profile,"light",null), co2: generateSensorValue(profile,"co2",null), ts: Date.now() };
    setSensors(initial);
    evaluateRisk(initial);
    intervalRef.current = setInterval(() => {
      setSensors(prev => {
        if (!prev) return prev;
        const next = { temp: generateSensorValue(profile,"temp",prev.temp,0.02), humidity: generateSensorValue(profile,"humidity",prev.humidity,0.02), soil: generateSensorValue(profile,"soil",prev.soil,0.015), light: generateSensorValue(profile,"light",prev.light,0.04), co2: generateSensorValue(profile,"co2",prev.co2,0.02), ts: Date.now() };
        setHistory(h => [...h.slice(-19), next]);
        setReadingCount(c => c + 1);
        evaluateRisk(next);
        return next;
      });
    }, 3000);
    uptimeRef.current = setInterval(() => setUptime(u => u + 1), 1000);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    clearInterval(uptimeRef.current);
  };

  useEffect(() => () => { clearInterval(intervalRef.current); clearInterval(uptimeRef.current); }, []);

  const formatUptime = (s) => `${Math.floor(s/60)}m ${(s%60).toString().padStart(2,"0")}s`;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#111827", paddingBottom: 20 }}>

      {/* Device status bar */}
      <div style={{ display:"flex", alignItems:"center", gap:16, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"10px 16px", marginBottom:20, flexWrap:"wrap" }}>
        {[
          { icon:"📡", label:"Device", val: deviceId },
          { icon:"🌿", label:"Crop",   val: selectedCrop },
          { icon:"⏱️", label:"Uptime", val: formatUptime(uptime) },
          { icon:"📊", label:"Readings", val: readingCount },
        ].map(item => (
          <div key={item.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:14 }}>{item.icon}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>{item.label}:</span>
            <span style={{ fontSize:12, color:"#111827", fontWeight:700, fontFamily:"monospace" }}>{item.val}</span>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background: isRunning ? "#16a34a" : "#9ca3af", boxShadow: isRunning ? "0 0 6px #16a34a" : "none" }} />
          <span style={{ fontSize:12, fontWeight:700, color: isRunning ? "#16a34a" : "#9ca3af" }}>
            {isRunning ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <label style={{ fontSize:13, color:"#374151", fontWeight:600, whiteSpace:"nowrap" }}>
            🌾 {lang === "hi" ? "फसल चुनें:" : "Select Crop:"}
          </label>
          <select value={selectedCrop}
            onChange={e => { setSelectedCrop(e.target.value); if (isRunning) stopSimulation(); }}
            style={{ flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"9px 12px", color:"#111827", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
            {Object.keys(CROP_PROFILES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={isRunning ? stopSimulation : startSimulation}
          style={{ padding:"10px 24px", background: isRunning ? "#ef4444" : "#16a34a", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
          {isRunning ? "⏹ Stop Sensors" : "▶ Start Sensors"}
        </button>
      </div>

      {/* Not running placeholder */}
      {!isRunning && !sensors && (
        <div style={{ textAlign:"center", padding:"60px 24px", background:"#f9fafb", borderRadius:16, border:"1px dashed #e5e7eb", marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#374151", marginBottom:6 }}>IoT Sensors Ready</div>
          <div style={{ fontSize:13, color:"#9ca3af", lineHeight:1.6 }}>
            Select your crop and press <strong>Start Sensors</strong> to begin live monitoring
          </div>
        </div>
      )}

      {/* Sensor cards */}
      {sensors && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:12, marginBottom:20 }}>
          {SENSOR_CONFIGS.map(cfg => {
            const val = sensors[cfg.id];
            const pct = Math.max(2, Math.min(100, ((val - cfg.min) / (cfg.max - cfg.min)) * 100));
            const status = cfg.id === "soil" ? getSoilStatus(val) : cfg.id === "light" ? getLightStatus(val) : null;
            return (
              <div key={cfg.id} style={{ background:"#fff", border:`1px solid #e5e7eb`, borderRadius:16, padding:"16px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", borderTop:`3px solid ${cfg.color}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{cfg.icon}</span>
                  {isRunning && <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, animation:"pulse 1.5s ease-in-out infinite" }} />}
                </div>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
                  {cfg.label}
                </div>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:700, color:cfg.color, lineHeight:1, marginBottom:8 }}>
                  {cfg.id === "temp" ? val.toFixed(1) : cfg.id === "light" ? Math.round(val).toLocaleString() : Math.round(val)}
                  <span style={{ fontSize:12, fontWeight:500, color:"#9ca3af", marginLeft:2 }}>{cfg.unit}</span>
                </div>
                <div style={{ height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:cfg.color, transition:"width 0.8s ease" }} />
                </div>
                {status && <div style={{ fontSize:10, fontWeight:700, color:status.color }}>{status.label}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Risk alerts */}
      {alerts.length > 0 && sensors && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
            🚨 Disease Risk Alerts
          </div>
          {alerts.map((alert, i) => (
            <div key={i} style={{ background:alert.bg, border:`1px solid ${alert.border}`, borderRadius:12, padding:"12px 16px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ background:alert.color, color:"#fff", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:800, textTransform:"uppercase" }}>
                  {alert.level}
                </span>
                <span style={{ fontSize:13, fontWeight:700, color:alert.color }}>{alert.name}</span>
              </div>
              <p style={{ fontSize:12, color:"#4b5563", lineHeight:1.6, margin:0 }}>💡 {alert.tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline chart */}
      {history.length > 3 && (
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
            📈 Live Sensor Trend (last {history.length} readings)
          </div>
          {["temp","humidity"].map(key => {
            const cfg  = SENSOR_CONFIGS.find(c => c.id === key);
            const vals = history.map(h => h[key]);
            const min  = Math.min(...vals);
            const max  = Math.max(...vals);
            const range = max - min || 1;
            return (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontSize:11, fontWeight:600, color:cfg.color, width:120, flexShrink:0 }}>
                  {cfg.icon} {cfg.label}
                </span>
                <div style={{ flex:1, height:40, background:"#f9fafb", borderRadius:8, overflow:"hidden", border:"1px solid #f3f4f6" }}>
                  <svg width="100%" height="40" viewBox={`0 0 ${history.length * 10} 40`} preserveAspectRatio="none">
                    <polyline fill="none" stroke={cfg.color} strokeWidth="2"
                      points={vals.map((v,i) => `${i*10},${40-((v-min)/range)*34}`).join(" ")} />
                  </svg>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:cfg.color, width:55, textAlign:"right", flexShrink:0 }}>
                  {key === "temp" ? sensors?.[key].toFixed(1) : Math.round(sensors?.[key])}{cfg.unit}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* IoT Architecture */}
      <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:16, padding:"16px 20px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#16a34a", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>
          🔧 IoT Architecture
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, flexWrap:"wrap", marginBottom:12 }}>
          {[
            { icon:"🌡️", label:"DHT22\nTemp + Humidity" },
            { icon:"→",  label:"" },
            { icon:"🌱", label:"Capacitive\nSoil Sensor" },
            { icon:"→",  label:"" },
            { icon:"🤖", label:"Raspberry\nPi 4B" },
            { icon:"→",  label:"" },
            { icon:"☁️", label:"LeafDoc AI\nBackend API" },
            { icon:"→",  label:"" },
            { icon:"📱", label:"Farmer\nAlert" },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ fontSize: item.icon === "→" ? 16 : 22, color: item.icon === "→" ? "#9ca3af" : "inherit" }}>{item.icon}</div>
              {item.label && <div style={{ fontSize:9, color:"#16a34a", textAlign:"center", lineHeight:1.4 }}>
                {item.label.split("\n").map((l,j) => <span key={j}>{l}<br/></span>)}
              </div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:"#16a34a", lineHeight:1.6, background:"#fff", borderRadius:8, padding:"8px 12px", border:"1px solid #bbf7d0" }}>
          📌 Real Raspberry Pi sends sensor data every 5 minutes to the API which calculates disease risk automatically.
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }`}</style>
    </div>
  );
}