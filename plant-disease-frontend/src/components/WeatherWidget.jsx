// components/WeatherWidget.jsx — Light theme weather widget
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const RISK_COLORS = {
  Critical: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", bar: "#ef4444" },
  High:     { bg: "#fff7ed", border: "#fed7aa", text: "#ea580c", bar: "#f97316" },
  Moderate: { bg: "#fefce8", border: "#fde047", text: "#ca8a04", bar: "#eab308" },
  Low:      { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", bar: "#22c55e" },
  Unknown:  { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280", bar: "#9ca3af" },
};

export default function WeatherWidget({ disease }) {
  const [weather, setWeather]     = useState(null);
  const [risk, setRisk]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [inputCity, setInputCity] = useState("");
  const [error, setError]         = useState("");

  const fetchWeather = async (params) => {
    setLoading(true); setError("");
    try {
      const qs  = new URLSearchParams({ ...params, disease: disease || "" }).toString();
      const res = await fetch(`${API_BASE}/api/weather/risk?${qs}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.success) { setWeather(data.weather); setRisk(data.disease_risk); }
      else setError("Weather data unavailable.");
    } catch { setError("Could not fetch weather."); }
    finally { setLoading(false); }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { setError("GPS not supported."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { setError("Could not get location."); setLoading(false); }
    );
  };

  const rc = risk ? (RISK_COLORS[risk.level] || RISK_COLORS.Unknown) : null;

  return (
    <div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
        🌦️ Environmental Risk Analysis
      </h3>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
        Check if today's weather conditions increase disease spread risk in your area.
      </p>

      {!weather && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#374151" }}
              placeholder="Enter your city (e.g. Delhi, Pune...)"
              value={inputCity}
              onChange={e => setInputCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && inputCity.trim() && fetchWeather({ city: inputCity.trim() })}
            />
            <button
              style={{ background: "#16a34a", border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
              onClick={() => inputCity.trim() && fetchWeather({ city: inputCity.trim() })}
              disabled={loading}>
              {loading ? "..." : "Check"}
            </button>
          </div>
          <button
            style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 14px", background: "#f9fafb", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            onClick={handleGPS} disabled={loading}>
            📍 Use My Location
          </button>
        </div>
      )}

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {error}</div>}
      {loading && <div style={{ color: "#16a34a", fontSize: 13, padding: "14px 0" }}>⏳ Fetching weather data...</div>}

      {weather && risk && !loading && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { icon: "🌡️", val: `${weather.temperature}°C`, label: "Temp" },
              { icon: "💧", val: `${weather.humidity}%`,      label: "Humidity" },
              { icon: "🌧️", val: `${weather.rainfall_mm}mm`, label: "Rainfall" },
              { icon: "💨", val: `${weather.wind_kmh} km/h`, label: "Wind" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ ...rc && { background: rc.bg, border: `1px solid ${rc.border}` }, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: rc?.text }}>{risk.level_icon} {risk.level} Risk</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces',serif", color: rc?.text }}>{risk.score}/100</span>
            </div>
            <div style={{ height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${risk.score}%`, background: rc?.bar, transition: "width 1s ease" }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: rc?.text, marginBottom: 8 }}>{risk.message}</p>
            {risk.tip && <p style={{ fontSize: 12, color: "#4b5563", background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "8px 10px" }}>💡 <strong>Action:</strong> {risk.tip}</p>}
          </div>

          <button
            style={{ width: "100%", background: "transparent", border: "1px solid #e5e7eb", borderRadius: 10, padding: 8, color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            onClick={() => { setWeather(null); setRisk(null); setInputCity(""); }}>
            📍 Change Location
          </button>
        </div>
      )}
    </div>
  );
}