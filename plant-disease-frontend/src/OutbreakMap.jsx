// OutbreakMap.jsx — Disease Outbreak Map with Leaflet.js Real India Map
// DTI Project | LeafDoc AI | Innovation #3
// Uses OpenStreetMap tiles + circle markers per state

import { useState, useEffect, useRef } from "react";
import { LiveFeedTicker, CommunityStatsBar } from "./CommunityReport";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATE_COORDS = {
  "Uttar Pradesh":    [26.85, 80.91],
  "Maharashtra":      [19.75, 75.71],
  "Bihar":            [25.09, 85.31],
  "West Bengal":      [22.98, 87.85],
  "Madhya Pradesh":   [22.97, 78.65],
  "Tamil Nadu":       [11.12, 78.65],
  "Rajasthan":        [27.02, 74.21],
  "Karnataka":        [15.31, 75.71],
  "Gujarat":          [22.25, 71.19],
  "Andhra Pradesh":   [15.91, 79.73],
  "Odisha":           [20.94, 85.09],
  "Telangana":        [18.11, 79.01],
  "Kerala":           [10.85, 76.27],
  "Jharkhand":        [23.61, 85.27],
  "Assam":            [26.20, 92.93],
  "Punjab":           [31.14, 75.34],
  "Haryana":          [29.05, 76.09],
  "Chhattisgarh":     [21.27, 81.86],
  "Uttarakhand":      [30.06, 79.54],
  "Himachal Pradesh": [31.10, 77.17],
  "Delhi":            [28.61, 77.20],
  "Jammu & Kashmir":  [33.72, 76.57],
};

const SEVERITY_COLORS = {
  Critical: { color: "#dc2626", fill: "#ef4444", fillOpacity: 0.75, label: "Critical" },
  High:     { color: "#ea580c", fill: "#f97316", fillOpacity: 0.65, label: "High"     },
  Moderate: { color: "#ca8a04", fill: "#eab308", fillOpacity: 0.55, label: "Moderate" },
  Low:      { color: "#16a34a", fill: "#22c55e", fillOpacity: 0.45, label: "Low"      },
  None:     { color: "#9ca3af", fill: "#d1d5db", fillOpacity: 0.2,  label: "No Data"  },
};

export default function OutbreakMap() {
  const mapRef         = useRef(null);
  const leafletMap     = useRef(null);
  const markersRef     = useRef({});
  const [outbreaks, setOutbreaks]         = useState(null);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [filter, setFilter]               = useState("All");
  const [timeMode, setTimeMode]           = useState("all");
  const [weeksAgo, setWeeksAgo]           = useState(0);
  const [weekMeta, setWeekMeta]           = useState(null);
  const [trends, setTrends]               = useState({});
  const [mapReady, setMapReady]           = useState(false);

  // ── Load Leaflet dynamically ──────────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setMapReady(true); return; }
    const link    = document.createElement("link");
    link.rel      = "stylesheet";
    link.href     = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script  = document.createElement("script");
    script.src    = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Fetch outbreak data ───────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/community/map`)
      .then(r => r.json())
      .then(d => { if (d.success) setOutbreaks(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch(`${API_BASE}/api/community/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {});
    fetch(`${API_BASE}/api/community/map/timeseries?weeks=4`)
      .then(r => r.json())
      .then(d => { if (d.success) setTrends(d.trends || {}); })
      .catch(() => {});
  }, []);

  // ── Initialize map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMap.current) return;
    const L   = window.L;
    const map = L.map(mapRef.current, {
      center: [22.5, 82.0], zoom: 5,
      zoomControl: true, scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", opacity: 0.65,
    }).addTo(map);
    leafletMap.current = map;
  }, [mapReady]);

  // ── Update markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMap.current || !outbreaks || !window.L) return;
    const L   = window.L;
    const map = leafletMap.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    Object.entries(STATE_COORDS).forEach(([stateName, coords]) => {
      const data     = outbreaks[stateName];
      const severity = data?.severity || "None";
      const cfg      = SEVERITY_COLORS[severity];

      if (filter !== "All" && severity !== filter && severity !== "None") return;

      const count  = data?.total_reports || 0;
      const radius = severity === "None" ? 6 : Math.max(10, Math.min(30, 8 + count * 0.25));
      const trend  = trends[stateName];
      const trendArrow = trend?.direction === "up" ? " ↑" : trend?.direction === "down" ? " ↓" : "";

      const marker = L.circleMarker(coords, {
        radius, color: cfg.color,
        fillColor: cfg.fill, fillOpacity: severity === "None" ? 0.1 : cfg.fillOpacity,
        weight: selectedState === stateName ? 3 : 1.5, opacity: 1,
      });

      const popupHtml = data
        ? `<div style="font-family:system-ui;min-width:180px;padding:2px">
            <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:5px">${stateName}${trendArrow}</div>
            <div style="display:inline-block;background:${cfg.fill}22;border:1px solid ${cfg.color};color:${cfg.color};
                 border-radius:5px;padding:2px 7px;font-size:11px;font-weight:700;margin-bottom:7px">
              ${severity} Risk · ${count} reports
            </div>
            ${data.top_diseases?.slice(0,3).map((d,i)=>
              `<div style="font-size:11px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6">
                ${i+1}. ${d.name} <b style="color:#16a34a">${d.count}</b>
              </div>`
            ).join("")}
          </div>`
        : `<div style="font-family:system-ui;padding:4px">
            <b>${stateName}</b><br/><span style="color:#999;font-size:11px">No reports yet</span>
           </div>`;

      marker.bindPopup(popupHtml, { maxWidth: 240 });
      marker.on("click", () => setSelectedState(stateName));
      marker.on("mouseover", function() { this.setStyle({ weight: 3 }); });
      marker.on("mouseout",  function() { this.setStyle({ weight: selectedState === stateName ? 3 : 1.5 }); });
      marker.addTo(map);
      markersRef.current[stateName] = marker;
    });
  }, [outbreaks, filter, trends, selectedState, mapReady]);

  // ── Week data loader ──────────────────────────────────────────────────────
  const loadWeekData = (wAgo) => {
    setLoading(true);
    fetch(`${API_BASE}/api/community/map/week?weeks_ago=${wAgo}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOutbreaks(d.data);
          setWeekMeta({ week_label: d.week_label, week_start: d.week_start, week_end: d.week_end });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleTimeModeSwitch = (mode) => {
    setTimeMode(mode); setSelectedState(null);
    if (mode === "all") {
      setLoading(true);
      fetch(`${API_BASE}/api/community/map`).then(r=>r.json())
        .then(d=>{ if(d.success) setOutbreaks(d.data); }).catch(()=>{})
        .finally(()=>setLoading(false));
      setWeekMeta(null);
    } else loadWeekData(weeksAgo);
  };

  const activeData = selectedState && outbreaks?.[selectedState];
  const stateList  = outbreaks
    ? Object.values(outbreaks).filter(s => filter === "All" || s.severity === filter)
        .sort((a,b) => b.total_reports - a.total_reports)
    : [];

  return (
    <div style={M.root}>

      {/* Header */}
      <div style={M.header}>
        <div style={M.headerLeft}>
          <div style={M.headerIcon}>🗺️</div>
          <div>
            <div style={M.headerTitle}>Disease Outbreak Map</div>
            <div style={M.headerSub}>India · Real-time community reports · Innovation #3</div>
          </div>
        </div>
        {stats && (
          <div style={M.headerStats}>
            <div style={M.headerStat}>
              <span style={M.headerStatVal}>{stats.total_reports}</span>
              <span style={M.headerStatLabel}>Total Reports</span>
            </div>
            <div style={M.headerStatDiv} />
            <div style={M.headerStat}>
              <span style={M.headerStatVal}>{stats.states_affected}</span>
              <span style={M.headerStatLabel}>States Affected</span>
            </div>
          </div>
        )}
      </div>

      {/* Time controls */}
      <div style={M.timeBar}>
        <div style={M.modeToggle}>
          {["all","week"].map(m => (
            <button key={m} style={{ ...M.modeBtn, ...(timeMode === m ? M.modeBtnActive : {}) }}
              onClick={() => handleTimeModeSwitch(m)}>
              {m === "all" ? "📊 All Time" : "📅 By Week"}
            </button>
          ))}
        </div>
        {timeMode === "week" && (
          <div style={M.weekSelector}>
            {[{l:"This Week",w:0},{l:"1 Week Ago",w:1},{l:"2 Weeks Ago",w:2},{l:"3 Weeks Ago",w:3}].map(({l,w}) => (
              <button key={w} style={{ ...M.weekBtn, ...(weeksAgo === w ? M.weekBtnActive : {}) }}
                onClick={() => { setWeeksAgo(w); loadWeekData(w); }}>{l}</button>
            ))}
          </div>
        )}
        {timeMode === "week" && weekMeta && (
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
            {weekMeta.week_label} · {weekMeta.week_start} – {weekMeta.week_end}
          </span>
        )}
      </div>

      <div style={M.body}>
        {/* Left: Map */}
        <div style={M.mapCol}>

          {/* Filter */}
          <div style={M.filterRow}>
            {["All","Critical","High","Moderate","Low"].map(f => (
              <button key={f} style={{ ...M.filterBtn, ...(filter === f ? M.filterBtnActive : {}) }}
                onClick={() => setFilter(f)}>
                {f !== "All" && <span style={{ ...M.filterDot, background: SEVERITY_COLORS[f]?.color }} />}
                {f}
              </button>
            ))}
          </div>

          <LiveFeedTicker lang="en" />

          {/* Leaflet Map */}
          <div style={M.mapWrap}>
            {(!mapReady || loading) && (
              <div style={M.mapLoading}>
                <div style={M.spinner} />
                <span style={{ color: "#16a34a", fontSize: 14 }}>
                  {!mapReady ? "Loading map..." : "Loading outbreak data..."}
                </span>
              </div>
            )}
            <div ref={mapRef} style={{ ...M.leafletMap, opacity: mapReady ? 1 : 0 }} />

            {/* Legend */}
            <div style={M.legend}>
              {Object.entries(SEVERITY_COLORS).filter(([k]) => k !== "None").map(([key, c]) => (
                <div key={key} style={M.legendItem}>
                  <div style={{ ...M.legendDot, background: c.color }} />
                  <span style={M.legendLabel}>{c.label}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 6, paddingTop: 6 }}>
                <div style={M.legendItem}>
                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>↑</span>
                  <span style={M.legendLabel}>Worsening</span>
                </div>
                <div style={M.legendItem}>
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>↓</span>
                  <span style={M.legendLabel}>Improving</span>
                </div>
              </div>
            </div>
          </div>

          {/* State detail */}
          {selectedState && (
            <div style={M.stateCard}>
              {activeData ? (
                <>
                  <div style={M.stateCardHeader}>
                    <div>
                      <div style={M.stateCardName}>
                        {selectedState}
                        {trends[selectedState]?.direction === "up" && (
                          <span style={{ color: "#ef4444", fontSize: 13, marginLeft: 8 }}>
                            ↑ +{trends[selectedState].change} vs last week
                          </span>
                        )}
                        {trends[selectedState]?.direction === "down" && (
                          <span style={{ color: "#16a34a", fontSize: 13, marginLeft: 8 }}>
                            ↓ -{trends[selectedState].change} vs last week
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: "inline-block", borderRadius: 8, padding: "3px 10px",
                        fontSize: 12, fontWeight: 700,
                        background: `${SEVERITY_COLORS[activeData.severity]?.fill}22`,
                        border: `1px solid ${SEVERITY_COLORS[activeData.severity]?.color}`,
                        color: SEVERITY_COLORS[activeData.severity]?.color,
                      }}>
                        {activeData.severity} Outbreak Risk
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                        {activeData.total_reports}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>reports</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Top diseases:
                  </div>
                  {activeData.top_diseases?.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "4px 0", borderBottom: "1px solid #f9fafb" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                      <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{d.name}</span>
                      <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>{d.count} cases</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: "#6b7280", fontSize: 13 }}>No reports for {selectedState} yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={M.sidebar}>
          {stats?.top_diseases?.length > 0 && (
            <div style={M.sideCard}>
              <div style={M.sideCardTitle}>🔥 Most Reported Nationally</div>
              {stats.top_diseases.map((d, i) => {
                const pct = Math.round((d.count / stats.total_reports) * 100);
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i+1}</div>
                      <span style={{ flex: 1, fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{d.count}</span>
                    </div>
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#bbf7d0,#16a34a)", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={M.sideCard}>
            <div style={M.sideCardTitle}>📍 States by Outbreak Level</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 340, overflowY: "auto" }}>
              {stateList.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: 12 }}>No states match this filter</div>
              ) : stateList.map(s => {
                const cfg = SEVERITY_COLORS[s.severity] || SEVERITY_COLORS.None;
                return (
                  <div key={s.state}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${selectedState === s.state ? "#bbf7d0" : "#f3f4f6"}`, background: selectedState === s.state ? "#f0fdf4" : "#fafafa", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedState(prev => prev === s.state ? null : s.state);
                      if (leafletMap.current && STATE_COORDS[s.state]) {
                        leafletMap.current.setView(STATE_COORDS[s.state], 6, { animate: true });
                        markersRef.current[s.state]?.openPopup();
                      }
                    }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                        {s.state}
                        {trends[s.state]?.direction === "up" && <span style={{ color: "#ef4444", fontSize: 10, marginLeft: 3 }}>↑</span>}
                        {trends[s.state]?.direction === "down" && <span style={{ color: "#16a34a", fontSize: 10, marginLeft: 3 }}>↓</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.top_disease}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>{s.total_reports}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
            🔒 All reports are anonymized. No personal data is stored. Reports help warn farmers about disease outbreaks in their region.
          </div>
        </div>
      </div>
    </div>
  );
}

const M = {
  root: { fontFamily: "'DM Sans',sans-serif", color: "#374151", paddingBottom: 40 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#166534,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 16px rgba(22,163,74,0.25)" },
  headerTitle: { fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#111827" },
  headerSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  headerStats: { display: "flex", alignItems: "center", gap: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "12px 24px" },
  headerStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  headerStatVal: { fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: "#16a34a" },
  headerStatLabel: { fontSize: 11, color: "#6b7280", fontWeight: 500 },
  headerStatDiv: { width: 1, height: 32, background: "#bbf7d0" },
  timeBar: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 16px", flexWrap: "wrap" },
  modeToggle: { display: "flex", gap: 4 },
  modeBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  modeBtnActive: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontWeight: 700 },
  weekSelector: { display: "flex", gap: 4, flexWrap: "wrap" },
  weekBtn: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "transparent", color: "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  weekBtnActive: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontWeight: 700 },
  body: { display: "grid", gridTemplateColumns: "1fr 290px", gap: 20, alignItems: "start" },
  mapCol: { display: "flex", flexDirection: "column", gap: 12 },
  filterRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  filterBtn: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  filterBtnActive: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontWeight: 700 },
  filterDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  mapWrap: { position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", height: 520, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  mapLoading: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 10, background: "rgba(248,255,254,0.9)" },
  spinner: { width: 20, height: 20, borderRadius: "50%", border: "2px solid #bbf7d0", borderTopColor: "#16a34a", animation: "spin 0.8s linear infinite" },
  leafletMap: { width: "100%", height: "100%", transition: "opacity 0.4s ease" },
  legend: { position: "absolute", bottom: 16, right: 16, background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb", zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  legendItem: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: 11, color: "#374151", fontWeight: 500 },
  stateCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  stateCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  stateCardName: { fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 },
  sidebar: { display: "flex", flexDirection: "column", gap: 14 },
  sideCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 },
  sideCardTitle: { fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 },
};