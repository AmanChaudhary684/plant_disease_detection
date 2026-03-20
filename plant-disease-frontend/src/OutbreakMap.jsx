// OutbreakMap.jsx — Disease Outbreak Map for India with Time-Series
// DTI Project | LeafDoc AI | Innovation #3
// Updated: Week-by-week time-series filter + trend arrows

import { useState, useEffect, useCallback } from "react";
import { LiveFeedTicker, CommunityStatsBar } from "./CommunityReport";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATE_PATHS = {
  "Jammu & Kashmir":  "M 165 30 L 210 25 L 235 45 L 220 70 L 195 75 L 170 60 Z",
  "Himachal Pradesh": "M 195 75 L 220 70 L 235 90 L 215 105 L 198 98 Z",
  "Punjab":           "M 160 85 L 195 75 L 198 98 L 180 108 L 158 100 Z",
  "Haryana":          "M 158 100 L 180 108 L 185 130 L 163 138 L 152 120 Z",
  "Delhi":            "M 175 122 L 185 118 L 188 130 L 178 133 Z",
  "Uttarakhand":      "M 198 98 L 215 105 L 228 118 L 210 132 L 192 125 L 185 112 Z",
  "Uttar Pradesh":    "M 163 138 L 185 130 L 192 125 L 260 130 L 280 155 L 255 185 L 210 188 L 178 178 L 158 160 Z",
  "Rajasthan":        "M 115 115 L 155 108 L 163 138 L 158 160 L 140 185 L 108 180 L 95 155 L 105 130 Z",
  "Gujarat":          "M 80 175 L 108 180 L 118 205 L 108 230 L 88 235 L 70 220 L 68 198 Z",
  "Madhya Pradesh":   "M 140 185 L 178 178 L 210 188 L 220 210 L 200 235 L 165 242 L 138 230 L 125 210 Z",
  "Bihar":            "M 260 130 L 298 128 L 308 148 L 285 168 L 255 165 L 255 145 Z",
  "Jharkhand":        "M 285 168 L 308 148 L 322 162 L 318 188 L 295 195 L 275 185 Z",
  "West Bengal":      "M 308 148 L 340 140 L 355 158 L 345 192 L 318 200 L 318 188 L 322 162 Z",
  "Chhattisgarh":     "M 210 188 L 255 185 L 275 185 L 285 215 L 265 242 L 235 248 L 218 232 L 220 210 Z",
  "Odisha":           "M 295 195 L 318 200 L 330 220 L 315 248 L 285 252 L 275 230 L 285 215 Z",
  "Maharashtra":      "M 108 230 L 138 230 L 165 242 L 200 235 L 218 232 L 222 258 L 200 278 L 168 282 L 138 270 L 110 255 L 100 238 Z",
  "Telangana":        "M 218 232 L 235 248 L 265 242 L 275 268 L 255 285 L 228 288 L 218 270 L 218 255 Z",
  "Andhra Pradesh":   "M 255 285 L 275 268 L 295 270 L 308 295 L 295 320 L 268 330 L 248 318 L 245 298 Z",
  "Karnataka":        "M 168 282 L 200 278 L 222 258 L 228 288 L 218 318 L 195 335 L 170 325 L 155 305 L 158 288 Z",
  "Tamil Nadu":       "M 195 335 L 218 318 L 245 298 L 248 318 L 240 348 L 218 368 L 200 360 L 188 345 Z",
  "Kerala":           "M 170 325 L 195 335 L 188 345 L 178 368 L 162 358 L 160 338 Z",
  "Assam":            "M 355 130 L 390 125 L 405 140 L 395 158 L 365 162 L 345 152 Z",
  "Goa":              "M 155 295 L 165 290 L 168 300 L 158 305 Z",
};

const SEVERITY_COLORS = {
  Critical: { fill: "rgba(239,68,68,0.75)",   stroke: "#ef4444", glow: "#ef4444", label: "Critical" },
  High:     { fill: "rgba(249,115,22,0.65)",  stroke: "#f97316", glow: "#f97316", label: "High" },
  Moderate: { fill: "rgba(234,179,8,0.55)",   stroke: "#eab308", glow: "#eab308", label: "Moderate" },
  Low:      { fill: "rgba(34,197,94,0.45)",   stroke: "#22c55e", glow: "#22c55e", label: "Low" },
  None:     { fill: "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.1)", glow: "transparent", label: "No Data" },
};

const TREND_CONFIG = {
  up:   { symbol: "↑", color: "#ef4444", label: "Worsening" },
  down: { symbol: "↓", color: "#22c55e", label: "Improving" },
  same: { symbol: "→", color: "#6b7280", label: "Stable" },
};

export default function OutbreakMap() {
  const [outbreaks, setOutbreaks]           = useState(null);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [hoveredState, setHoveredState]     = useState(null);
  const [selectedState, setSelectedState]   = useState(null);
  const [filter, setFilter]                 = useState("All");

  // ── Time-series state ──────────────────────────────────────────────────────
  const [timeMode, setTimeMode]             = useState("all");   // "all" | "week"
  const [weeksAgo, setWeeksAgo]             = useState(0);       // 0=this week, 1=last week...
  const [weekMeta, setWeekMeta]             = useState(null);    // {week_label, week_start, week_end, total_reports}
  const [trends, setTrends]                 = useState({});      // trend per state
  const [weeklyLoading, setWeeklyLoading]   = useState(false);
  const [allWeeksSummary, setAllWeeksSummary] = useState(null);  // chart data

  // ── Load all-time data ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/community/map`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOutbreaks(data.data);
          return fetch(`${API_BASE}/api/community/stats`);
        }
      })
      .then(r => r && r.json())
      .then(statsData => {
        if (statsData?.success) setStats(statsData.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load trend data (4 weeks)
    fetch(`${API_BASE}/api/community/map/timeseries?weeks=4`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTrends(data.trends || {});
          setAllWeeksSummary(data.weeks || []);
        }
      })
      .catch(() => {});
  }, []);

  // ── Load weekly data when week mode is active ──────────────────────────────
  const loadWeekData = useCallback((wAgo) => {
    setWeeklyLoading(true);
    fetch(`${API_BASE}/api/community/map/week?weeks_ago=${wAgo}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOutbreaks(data.data);
          setWeekMeta({
            week_label:    data.week_label,
            week_start:    data.week_start,
            week_end:      data.week_end,
            total_reports: data.total_reports,
            states_affected: data.states_affected,
          });
        }
      })
      .catch(() => {})
      .finally(() => setWeeklyLoading(false));
  }, []);

  const handleTimeModeSwitch = (mode) => {
    setTimeMode(mode);
    setSelectedState(null);
    if (mode === "all") {
      setLoading(true);
      fetch(`${API_BASE}/api/community/map`)
        .then(r => r.json())
        .then(data => { if (data.success) setOutbreaks(data.data); })
        .catch(() => {})
        .finally(() => setLoading(false));
      setWeekMeta(null);
    } else {
      loadWeekData(weeksAgo);
    }
  };

  const handleWeekChange = (wAgo) => {
    setWeeksAgo(wAgo);
    loadWeekData(wAgo);
  };

  const getStateSeverity = (stateName) => {
    if (!outbreaks || !outbreaks[stateName]) return "None";
    return outbreaks[stateName].severity;
  };

  const getStateColor = (stateName) => {
    const severity = getStateSeverity(stateName);
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.None;
  };

  const activeState = selectedState || hoveredState;
  const activeData  = activeState && outbreaks?.[activeState];

  const stateList = outbreaks
    ? Object.values(outbreaks)
        .filter(s => filter === "All" || s.severity === filter)
        .sort((a, b) => b.total_reports - a.total_reports)
    : [];

  return (
    <div style={M.root}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
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

      {/* ── Time-Series Controls ──────────────────────────────────────────── */}
      <div style={M.timeSeriesBar}>
        {/* Mode toggle */}
        <div style={M.modeToggle}>
          <button
            style={{...M.modeBtn, ...(timeMode === "all" ? M.modeBtnActive : {})}}
            onClick={() => handleTimeModeSwitch("all")}>
            📊 All Time
          </button>
          <button
            style={{...M.modeBtn, ...(timeMode === "week" ? M.modeBtnActive : {})}}
            onClick={() => handleTimeModeSwitch("week")}>
            📅 By Week
          </button>
        </div>

        {/* Week selector — only visible in week mode */}
        {timeMode === "week" && (
          <div style={M.weekSelector}>
            {[
              { label: "This Week", wAgo: 0 },
              { label: "1 Week Ago", wAgo: 1 },
              { label: "2 Weeks Ago", wAgo: 2 },
              { label: "3 Weeks Ago", wAgo: 3 },
            ].map(({ label, wAgo }) => (
              <button
                key={wAgo}
                style={{...M.weekBtn, ...(weeksAgo === wAgo ? M.weekBtnActive : {})}}
                onClick={() => handleWeekChange(wAgo)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Week meta info */}
        {timeMode === "week" && weekMeta && (
          <div style={M.weekInfo}>
            <span style={M.weekInfoLabel}>{weekMeta.week_label}</span>
            <span style={M.weekInfoDate}>{weekMeta.week_start} – {weekMeta.week_end}</span>
            <span style={M.weekInfoReports}>{weekMeta.total_reports} reports · {weekMeta.states_affected} states</span>
          </div>
        )}

        {/* Trend legend — only in all-time mode */}
        {timeMode === "all" && Object.keys(trends).length > 0 && (
          <div style={M.trendLegend}>
            <span style={M.trendLegendLabel}>vs last week:</span>
            {Object.entries(TREND_CONFIG).map(([key, cfg]) => (
              <div key={key} style={M.trendLegendItem}>
                <span style={{...M.trendSymbol, color: cfg.color}}>{cfg.symbol}</span>
                <span style={M.trendLegendText}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mini weekly chart ─────────────────────────────────────────────── */}
      {timeMode === "all" && allWeeksSummary?.length > 0 && (
        <div style={M.weekChart}>
          <div style={M.weekChartTitle}>📈 Weekly Report Trend (Last 4 Weeks)</div>
          <div style={M.weekChartBars}>
            {allWeeksSummary.map((week, i) => {
              const maxVal = Math.max(...allWeeksSummary.map(w => w.total_reports), 1);
              const pct    = Math.max(8, (week.total_reports / maxVal) * 100);
              const isLast = i === allWeeksSummary.length - 1;
              return (
                <div key={i} style={M.weekChartBar}>
                  <div style={M.weekChartBarCount}>{week.total_reports}</div>
                  <div style={{
                    ...M.weekChartBarFill,
                    height: `${pct}%`,
                    background: isLast
                      ? "linear-gradient(to top, #16a34a, #4ade80)"
                      : "linear-gradient(to top, rgba(74,222,128,0.3), rgba(74,222,128,0.5))",
                    border: isLast ? "1px solid #4ade80" : "1px solid rgba(74,222,128,0.2)",
                  }} />
                  <div style={M.weekChartBarLabel}>{week.week_label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading || weeklyLoading ? (
        <div style={M.loadingBox}>
          <div style={M.loadingSpinner} />
          <span style={{color:"#6ee7b7", fontSize:14}}>
            {weeklyLoading ? "Loading week data..." : "Loading outbreak data..."}
          </span>
        </div>
      ) : (
        <div style={M.body}>

          {/* ── LEFT: Map ──────────────────────────────────────────────────── */}
          <div style={M.mapCol}>

            {/* Filter tabs */}
            <div style={M.filterRow}>
              {["All", "Critical", "High", "Moderate", "Low"].map(f => (
                <button key={f}
                  style={{...M.filterBtn, ...(filter === f ? M.filterBtnActive : {})}}
                  onClick={() => setFilter(f)}>
                  {f !== "All" && <span style={{...M.filterDot, background: SEVERITY_COLORS[f]?.stroke}} />}
                  {f}
                </button>
              ))}
            </div>

            <LiveFeedTicker lang="en" />
            <CommunityStatsBar lang="en" />

            {/* SVG Map */}
            <div style={M.mapWrap}>
              <svg viewBox="60 20 380 380" style={M.svg}>
                <defs>
                  {Object.entries(SEVERITY_COLORS).map(([key]) => (
                    <filter key={key} id={`glow-${key}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  ))}
                </defs>

                {Object.entries(STATE_PATHS).map(([stateName, path]) => {
                  const col      = getStateColor(stateName);
                  const isHover  = hoveredState === stateName;
                  const isSelect = selectedState === stateName;
                  const severity = getStateSeverity(stateName);
                  return (
                    <path
                      key={stateName}
                      d={path}
                      fill={isHover || isSelect ? col.fill.replace(/[\d.]+\)$/, "0.9)") : col.fill}
                      stroke={col.stroke}
                      strokeWidth={isHover || isSelect ? 1.5 : 0.8}
                      style={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        filter: (isHover || isSelect) && severity !== "None"
                          ? `drop-shadow(0 0 6px ${col.glow})` : "none",
                      }}
                      onMouseEnter={() => setHoveredState(stateName)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setSelectedState(prev => prev === stateName ? null : stateName)}
                    />
                  );
                })}

                {/* State abbreviation labels */}
                {outbreaks && Object.entries(outbreaks).slice(0, 12).map(([stateName, data]) => {
                  const svgX = (data.lon - 68) * 5.2 + 65;
                  const svgY = (38 - data.lat) * 5.8 + 28;
                  return (
                    <text key={stateName} x={svgX} y={svgY}
                      style={{fontSize:6, fill:"rgba(255,255,255,0.7)", fontFamily:"sans-serif",
                              fontWeight:"bold", pointerEvents:"none", textAnchor:"middle"}}>
                      {data.abbr}
                    </text>
                  );
                })}

                {/* Trend arrows overlay — only in all-time mode */}
                {timeMode === "all" && outbreaks && Object.entries(outbreaks).map(([stateName, data]) => {
                  const trend = trends[stateName];
                  if (!trend || trend.direction === "same") return null;
                  const svgX = (data.lon - 68) * 5.2 + 65;
                  const svgY = (38 - data.lat) * 5.8 + 33;
                  const tCfg = TREND_CONFIG[trend.direction];
                  return (
                    <text key={`trend-${stateName}`} x={svgX} y={svgY}
                      style={{
                        fontSize: 8,
                        fill: tCfg.color,
                        fontFamily: "sans-serif",
                        fontWeight: "bold",
                        pointerEvents: "none",
                        textAnchor: "middle",
                        opacity: 0.9,
                      }}>
                      {tCfg.symbol}
                    </text>
                  );
                })}
              </svg>

              <div style={M.legend}>
                {Object.entries(SEVERITY_COLORS).filter(([k]) => k !== "None").map(([key, c]) => (
                  <div key={key} style={M.legendItem}>
                    <div style={{...M.legendDot, background: c.stroke}} />
                    <span style={M.legendLabel}>{c.label}</span>
                  </div>
                ))}
                {timeMode === "all" && Object.keys(trends).length > 0 && (
                  <>
                    <div style={{...M.legendItem, marginTop:6, paddingTop:6, borderTop:"1px solid rgba(74,222,128,0.15)"}}>
                      <span style={{fontSize:10, color:"#ef4444", fontWeight:700}}>↑</span>
                      <span style={M.legendLabel}>Worsening</span>
                    </div>
                    <div style={M.legendItem}>
                      <span style={{fontSize:10, color:"#22c55e", fontWeight:700}}>↓</span>
                      <span style={M.legendLabel}>Improving</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* State detail card */}
            {activeState && (
              <div style={M.stateCard}>
                {activeData ? (
                  <>
                    <div style={M.stateCardHeader}>
                      <div>
                        <div style={M.stateCardName}>
                          {activeState}
                          {/* Trend badge */}
                          {timeMode === "all" && trends[activeState] && trends[activeState].direction !== "same" && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 12,
                              color: TREND_CONFIG[trends[activeState].direction].color,
                              fontWeight: 700,
                            }}>
                              {TREND_CONFIG[trends[activeState].direction].symbol}
                              {" "}
                              {trends[activeState].change} vs last week
                            </span>
                          )}
                        </div>
                        <div style={{
                          ...M.stateCardBadge,
                          background: SEVERITY_COLORS[activeData.severity]?.fill,
                          border: `1px solid ${SEVERITY_COLORS[activeData.severity]?.stroke}`,
                          color: SEVERITY_COLORS[activeData.severity]?.stroke,
                        }}>
                          {activeData.severity} Outbreak Risk
                          {timeMode === "week" && weekMeta && ` · ${weekMeta.week_label}`}
                        </div>
                      </div>
                      <div style={M.stateCardTotal}>
                        <span style={M.stateCardTotalNum}>{activeData.total_reports}</span>
                        <span style={M.stateCardTotalLabel}>reports</span>
                      </div>
                    </div>
                    <div style={M.stateCardDiseases}>
                      <div style={M.stateCardDiseasesTitle}>Top diseases reported:</div>
                      {activeData.top_diseases?.map((d, i) => (
                        <div key={i} style={M.stateCardDiseaseRow}>
                          <span style={M.stateCardDiseaseRank}>{i + 1}</span>
                          <span style={M.stateCardDiseaseName}>{d.name}</span>
                          <span style={M.stateCardDiseaseCount}>{d.count} cases</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{color:"#6ee7b7", fontSize:13, padding:"8px 0"}}>
                    No disease reports for {activeState}
                    {timeMode === "week" && weekMeta ? ` during ${weekMeta.week_label}.` : " yet."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ─────────────────────────────────────────────── */}
          <div style={M.sidebar}>
            {stats?.top_diseases?.length > 0 && (
              <div style={M.sideCard}>
                <div style={M.sideCardTitle}>🔥 Most Reported Nationally</div>
                {stats.top_diseases.map((d, i) => {
                  const pct = Math.round((d.count / stats.total_reports) * 100);
                  return (
                    <div key={i} style={M.nationalRow}>
                      <div style={M.nationalRowTop}>
                        <span style={M.nationalRank}>{i + 1}</span>
                        <span style={M.nationalName}>{d.name}</span>
                        <span style={M.nationalCount}>{d.count}</span>
                      </div>
                      <div style={M.nationalBar}>
                        <div style={{...M.nationalBarFill, width:`${pct}%`}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={M.sideCard}>
              <div style={M.sideCardTitle}>📍 States by Outbreak Level</div>
              <div style={M.stateList}>
                {stateList.length === 0 ? (
                  <div style={{color:"#6ee7b7", fontSize:12, textAlign:"center", padding:"12px 0"}}>
                    No states match this filter
                  </div>
                ) : stateList.map((s) => {
                  const col   = SEVERITY_COLORS[s.severity] || SEVERITY_COLORS.None;
                  const trend = trends[s.state];
                  return (
                    <div key={s.state}
                      style={{...M.stateListItem, ...(selectedState === s.state ? M.stateListItemActive : {})}}
                      onClick={() => setSelectedState(prev => prev === s.state ? null : s.state)}>
                      <div style={{...M.stateListDot, background: col.stroke}} />
                      <div style={M.stateListInfo}>
                        <div style={M.stateListName}>
                          {s.state}
                          {/* Inline trend arrow */}
                          {timeMode === "all" && trend && trend.direction !== "same" && (
                            <span style={{
                              marginLeft: 5,
                              fontSize: 11,
                              color: TREND_CONFIG[trend.direction].color,
                              fontWeight: 700,
                            }}>
                              {TREND_CONFIG[trend.direction].symbol}
                            </span>
                          )}
                        </div>
                        <div style={M.stateListDisease}>{s.top_disease}</div>
                      </div>
                      <div style={{...M.stateListCount, color: col.stroke}}>{s.total_reports}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={M.note}>
              🔒 All reports are anonymized. No personal data is stored. Reports help warn farmers about disease outbreaks in their region.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const M = {
  root: { fontFamily:"'Cabinet Grotesk',sans-serif", color:"#e2f5e6", paddingBottom:40 },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 },
  headerLeft: { display:"flex", alignItems:"center", gap:14 },
  headerIcon: { width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#166534,#15803d)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 0 20px rgba(22,163,74,0.4)" },
  headerTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:700, color:"#f0fdf4" },
  headerSub: { fontSize:12, color:"#6ee7b7", marginTop:2 },
  headerStats: { display:"flex", alignItems:"center", gap:20, background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:16, padding:"12px 24px" },
  headerStat: { display:"flex", flexDirection:"column", alignItems:"center" },
  headerStatVal: { fontFamily:"'Clash Display',sans-serif", fontSize:24, fontWeight:800, color:"#4ade80" },
  headerStatLabel: { fontSize:11, color:"#6ee7b7", fontWeight:500 },
  headerStatDiv: { width:1, height:32, background:"rgba(74,222,128,0.2)" },

  // ── Time-series controls ───────────────────────────────────────────────────
  timeSeriesBar: { display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap", background:"rgba(10,40,18,0.5)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:14, padding:"12px 16px" },
  modeToggle: { display:"flex", gap:6 },
  modeBtn: { padding:"7px 16px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", background:"transparent", color:"#6ee7b7", fontSize:12, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500 },
  modeBtnActive: { background:"rgba(74,222,128,0.18)", border:"1px solid rgba(74,222,128,0.45)", color:"#bbf7d0", fontWeight:700 },
  weekSelector: { display:"flex", gap:6, flexWrap:"wrap" },
  weekBtn: { padding:"5px 12px", borderRadius:8, border:"1px solid rgba(74,222,128,0.15)", background:"transparent", color:"#6ee7b7", fontSize:11, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif" },
  weekBtnActive: { background:"rgba(74,222,128,0.2)", border:"1px solid rgba(74,222,128,0.4)", color:"#bbf7d0", fontWeight:700 },
  weekInfo: { display:"flex", flexDirection:"column", gap:2 },
  weekInfoLabel: { fontSize:13, fontWeight:700, color:"#4ade80" },
  weekInfoDate: { fontSize:11, color:"#6ee7b7" },
  weekInfoReports: { fontSize:11, color:"#4b7a57" },
  trendLegend: { display:"flex", alignItems:"center", gap:10, marginLeft:"auto" },
  trendLegendLabel: { fontSize:11, color:"#4b7a57", fontWeight:600 },
  trendLegendItem: { display:"flex", alignItems:"center", gap:3 },
  trendSymbol: { fontSize:13, fontWeight:800 },
  trendLegendText: { fontSize:11, color:"#6ee7b7" },

  // ── Weekly chart ────────────────────────────────────────────────────────────
  weekChart: { background:"rgba(10,40,18,0.5)", border:"1px solid rgba(74,222,128,0.12)", borderRadius:14, padding:"14px 16px", marginBottom:16 },
  weekChartTitle: { fontSize:12, fontWeight:700, color:"#86efac", marginBottom:10 },
  weekChartBars: { display:"flex", alignItems:"flex-end", gap:8, height:70 },
  weekChartBar: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%" },
  weekChartBarCount: { fontSize:10, color:"#4ade80", fontWeight:700 },
  weekChartBarFill: { width:"100%", borderRadius:"4px 4px 0 0", minHeight:8, transition:"height 0.5s ease" },
  weekChartBarLabel: { fontSize:9, color:"#6ee7b7", textAlign:"center", lineHeight:1.3 },

  loadingBox: { display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"80px 0" },
  loadingSpinner: { width:24, height:24, borderRadius:"50%", border:"2px solid rgba(74,222,128,0.3)", borderTopColor:"#4ade80", animation:"spin 0.8s linear infinite" },
  body: { display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" },
  mapCol: { display:"flex", flexDirection:"column", gap:16 },
  filterRow: { display:"flex", gap:8, flexWrap:"wrap" },
  filterBtn: { display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", background:"transparent", color:"#6ee7b7", fontSize:12, cursor:"pointer", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:500 },
  filterBtnActive: { background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.4)", color:"#bbf7d0", fontWeight:700 },
  filterDot: { width:8, height:8, borderRadius:"50%", display:"inline-block" },
  mapWrap: { background:"rgba(10,40,18,0.5)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:20, padding:"20px", position:"relative", backdropFilter:"blur(10px)" },
  svg: { width:"100%", height:"auto", display:"block" },
  legend: { position:"absolute", bottom:16, right:16, display:"flex", flexDirection:"column", gap:6, background:"rgba(5,20,8,0.85)", borderRadius:10, padding:"10px 14px", border:"1px solid rgba(74,222,128,0.15)" },
  legendItem: { display:"flex", alignItems:"center", gap:8 },
  legendDot: { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  legendLabel: { fontSize:11, color:"#a7f3d0", fontWeight:500 },
  stateCard: { background:"rgba(10,40,18,0.7)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:16, padding:"18px", backdropFilter:"blur(16px)" },
  stateCardHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 },
  stateCardName: { fontFamily:"'Clash Display',sans-serif", fontSize:18, fontWeight:700, color:"#f0fdf4", marginBottom:6 },
  stateCardBadge: { display:"inline-block", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 },
  stateCardTotal: { display:"flex", flexDirection:"column", alignItems:"flex-end" },
  stateCardTotalNum: { fontFamily:"'Clash Display',sans-serif", fontSize:28, fontWeight:800, color:"#4ade80", lineHeight:1 },
  stateCardTotalLabel: { fontSize:11, color:"#6ee7b7" },
  stateCardDiseases: {},
  stateCardDiseasesTitle: { fontSize:11, color:"#4b7a57", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 },
  stateCardDiseaseRow: { display:"flex", alignItems:"center", gap:10, marginBottom:8 },
  stateCardDiseaseRank: { width:20, height:20, borderRadius:"50%", background:"rgba(74,222,128,0.2)", color:"#4ade80", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  stateCardDiseaseName: { flex:1, fontSize:13, color:"#a7f3d0" },
  stateCardDiseaseCount: { fontSize:12, color:"#4ade80", fontWeight:700 },
  sidebar: { display:"flex", flexDirection:"column", gap:16 },
  sideCard: { background:"rgba(10,40,18,0.6)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:18, padding:"18px", backdropFilter:"blur(16px)" },
  sideCardTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:14, fontWeight:700, color:"#bbf7d0", marginBottom:14 },
  nationalRow: { marginBottom:12 },
  nationalRowTop: { display:"flex", alignItems:"center", gap:8, marginBottom:5 },
  nationalRank: { width:18, height:18, borderRadius:"50%", background:"rgba(74,222,128,0.2)", color:"#4ade80", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  nationalName: { flex:1, fontSize:12, color:"#a7f3d0", lineHeight:1.4 },
  nationalCount: { fontSize:13, fontWeight:700, color:"#4ade80" },
  nationalBar: { height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" },
  nationalBarFill: { height:"100%", background:"linear-gradient(90deg,rgba(74,222,128,0.4),#4ade80)", borderRadius:2, transition:"width 1s ease" },
  stateList: { display:"flex", flexDirection:"column", gap:6, maxHeight:380, overflowY:"auto" },
  stateListItem: { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.15)", cursor:"pointer" },
  stateListItemActive: { background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)" },
  stateListDot: { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  stateListInfo: { flex:1, minWidth:0 },
  stateListName: { fontSize:13, fontWeight:600, color:"#d1fae5", marginBottom:2 },
  stateListDisease: { fontSize:11, color:"#6ee7b7", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  stateListCount: { fontSize:14, fontWeight:800, fontFamily:"'Clash Display',sans-serif", flexShrink:0 },
  note: { background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.12)", borderRadius:12, padding:"12px 14px", fontSize:11, color:"#4b7a57", lineHeight:1.7 },
};