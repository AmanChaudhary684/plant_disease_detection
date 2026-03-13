/**
 * ProgressionTracker.jsx — LeafDoc AI
 * DTI Project | Disease Progression Tracking
 * 
 * Tracks repeated scans of the same plant over time to monitor
 * whether disease is getting better, worse, or stable.
 * 
 * Place in: src/ProgressionTracker.jsx
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "leafdoc_plants";

// ── Helpers ───────────────────────────────────────────────────────────────
function loadPlants() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function savePlants(plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

function getTrend(scans) {
  if (scans.length < 2) return "new";
  const last = scans[scans.length - 1].confidence;
  const prev = scans[scans.length - 2].confidence;
  const lastHealthy = scans[scans.length - 1].is_healthy;
  const prevHealthy = scans[scans.length - 2].is_healthy;
  if (lastHealthy && !prevHealthy) return "recovered";
  if (!lastHealthy && prevHealthy) return "worsened";
  if (lastHealthy && prevHealthy) return "stable_healthy";
  const diff = last - prev;
  if (diff > 10) return "worsening";
  if (diff < -10) return "improving";
  return "stable";
}

const TREND_CONFIG = {
  new:            { icon: "🆕", label: "New Plant",     color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
  recovered:      { icon: "🎉", label: "Recovered!",    color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  improving:      { icon: "📈", label: "Improving",     color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
  stable_healthy: { icon: "✅", label: "Healthy",       color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
  stable:         { icon: "➡️", label: "Stable",        color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  worsening:      { icon: "📉", label: "Worsening",     color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  worsened:       { icon: "⚠️", label: "Got Worse",    color: "#fb923c", bg: "rgba(249,115,22,0.1)"  },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Save Scan to Plant ─────────────────────────────────────────────────────
export function saveToPlant(result, plantId) {
  const plants = loadPlants();
  const scan = {
    id:          Date.now(),
    timestamp:   result.timestamp || new Date().toISOString(),
    disease:     result.diagnosis.top_prediction.display_name,
    disease_id:  result.diagnosis.top_prediction.class_id,
    confidence:  result.diagnosis.top_prediction.confidence,
    is_healthy:  result.diagnosis.is_healthy,
    severity:    result.disease_info?.severity || "Unknown",
    preview:     null, // don't store image to save space
  };

  if (plantId) {
    // Add to existing plant
    const idx = plants.findIndex(p => p.id === plantId);
    if (idx !== -1) {
      plants[idx].scans.push(scan);
      plants[idx].last_updated = scan.timestamp;
      plants[idx].trend = getTrend(plants[idx].scans);
      savePlants(plants);
      return plants[idx];
    }
  }

  // Create new plant entry
  const newPlant = {
    id:           Date.now(),
    name:         `Plant ${plants.length + 1}`,
    crop:         scan.disease_id.split("___")[0].split("_")[0],
    created:      scan.timestamp,
    last_updated: scan.timestamp,
    trend:        "new",
    scans:        [scan],
  };
  plants.unshift(newPlant);
  savePlants(plants);
  return newPlant;
}

// ── Add to Plant Modal ─────────────────────────────────────────────────────
export function AddToPlantModal({ result, onSave, onClose }) {
  const [plants, setPlants]     = useState(loadPlants);
  const [selected, setSelected] = useState(null);
  const [newName, setNewName]   = useState("");
  const [mode, setMode]         = useState("existing"); // existing | new

  const handleSave = () => {
    if (mode === "new") {
      const plant = saveToPlant(result, null);
      if (newName.trim()) {
        const all = loadPlants();
        const idx = all.findIndex(p => p.id === plant.id);
        if (idx !== -1) { all[idx].name = newName.trim(); savePlants(all); }
      }
      onSave(plant);
    } else if (selected) {
      const plant = saveToPlant(result, selected);
      onSave(plant);
    }
    onClose();
  };

  return (
    <div style={PM.overlay} onClick={onClose}>
      <div style={PM.modal} onClick={e => e.stopPropagation()}>
        <div style={PM.modalHeader}>
          <span style={PM.modalIcon}>📊</span>
          <div>
            <div style={PM.modalTitle}>Track Disease Progression</div>
            <div style={PM.modalSub}>Save this scan to monitor your plant over time</div>
          </div>
          <button style={PM.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={PM.modeTabs}>
          <button style={{ ...PM.modeTab, ...(mode === "existing" ? PM.modeTabActive : {}) }}
            onClick={() => setMode("existing")}>
            Add to Existing Plant
          </button>
          <button style={{ ...PM.modeTab, ...(mode === "new" ? PM.modeTabActive : {}) }}
            onClick={() => setMode("new")}>
            + New Plant
          </button>
        </div>

        {mode === "existing" ? (
          <div>
            {plants.length === 0 ? (
              <div style={PM.emptyMsg}>No plants tracked yet. Create a new plant first!</div>
            ) : (
              <div style={PM.plantList}>
                {plants.map(p => {
                  const trend = TREND_CONFIG[p.trend] || TREND_CONFIG.new;
                  return (
                    <div key={p.id}
                      style={{ ...PM.plantItem, ...(selected === p.id ? PM.plantItemActive : {}) }}
                      onClick={() => setSelected(p.id)}>
                      <div style={{ ...PM.plantTrendDot, background: trend.color }} />
                      <div style={PM.plantInfo}>
                        <div style={PM.plantName}>{p.name}</div>
                        <div style={PM.plantMeta}>{p.scans.length} scans · {timeAgo(p.last_updated)}</div>
                      </div>
                      <div style={{ ...PM.plantTrend, color: trend.color }}>
                        {trend.icon} {trend.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={PM.newPlantForm}>
            <label style={PM.label}>Plant nickname (optional)</label>
            <input style={PM.input}
              placeholder={`e.g. Backyard Tomato, Pot #3...`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div style={PM.newPlantHint}>
              Will create a new plant timeline starting with this scan.
            </div>
          </div>
        )}

        <button style={{ ...PM.saveBtn,
          ...(mode === "existing" && !selected ? PM.saveBtnOff : {}) }}
          disabled={mode === "existing" && !selected}
          onClick={handleSave}>
          📊 Save to Progression Tracker
        </button>
      </div>
    </div>
  );
}

// ── Progression Tracker Main View ──────────────────────────────────────────
export default function ProgressionTracker({ onClose }) {
  const [plants, setPlants]         = useState(loadPlants);
  const [selected, setSelected]     = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput]   = useState("");

  const refresh = () => setPlants(loadPlants());

  const deletePlant = (id) => {
    const all = loadPlants().filter(p => p.id !== id);
    savePlants(all);
    if (selected?.id === id) setSelected(null);
    refresh();
  };

  const deleteScan = (plantId, scanId) => {
    const all = loadPlants();
    const idx = all.findIndex(p => p.id === plantId);
    if (idx === -1) return;
    all[idx].scans = all[idx].scans.filter(s => s.id !== scanId);
    all[idx].trend = getTrend(all[idx].scans);
    savePlants(all);
    setSelected(all[idx]);
    refresh();
  };

  const renamePlant = (id) => {
    if (!nameInput.trim()) return;
    const all = loadPlants();
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) { all[idx].name = nameInput.trim(); savePlants(all); }
    setEditingName(null);
    setNameInput("");
    refresh();
  };

  const selectedPlant = plants.find(p => p.id === selected?.id);

  return (
    <div style={PT.root}>
      {/* Header */}
      <div style={PT.header}>
        <div style={PT.headerLeft}>
          <div style={PT.headerIcon}>📊</div>
          <div>
            <div style={PT.headerTitle}>Disease Progression Tracker</div>
            <div style={PT.headerSub}>Monitor your plants over time · {plants.length} plant{plants.length !== 1 ? "s" : ""} tracked</div>
          </div>
        </div>
        {onClose && (
          <button style={PT.closeBtn} onClick={onClose}>✕ Close</button>
        )}
      </div>

      {plants.length === 0 ? (
        <div style={PT.emptyState}>
          <div style={PT.emptyIcon}>🌱</div>
          <div style={PT.emptyTitle}>No plants tracked yet</div>
          <div style={PT.emptySub}>
            After scanning a leaf, click <strong>"📊 Track Progression"</strong> on the result page
            to start monitoring your plant's health over time.
          </div>
        </div>
      ) : (
        <div style={PT.body}>
          {/* Plant list */}
          <div style={PT.plantList}>
            <div style={PT.listTitle}>Your Plants</div>
            {plants.map(p => {
              const trend = TREND_CONFIG[p.trend] || TREND_CONFIG.new;
              const isSelected = selectedPlant?.id === p.id;
              return (
                <div key={p.id}
                  style={{ ...PT.plantCard, ...(isSelected ? PT.plantCardActive : {}) }}
                  onClick={() => setSelected(p)}>
                  {/* Trend indicator */}
                  <div style={{ ...PT.trendBar, background: trend.color }} />
                  <div style={PT.plantCardInner}>
                    {editingName === p.id ? (
                      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <input style={PT.nameInput} value={nameInput} autoFocus
                          onChange={e => setNameInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && renamePlant(p.id)} />
                        <button style={PT.nameBtn} onClick={() => renamePlant(p.id)}>✓</button>
                        <button style={PT.nameBtn} onClick={() => setEditingName(null)}>✕</button>
                      </div>
                    ) : (
                      <div style={PT.plantName}
                        onDoubleClick={e => { e.stopPropagation(); setEditingName(p.id); setNameInput(p.name); }}>
                        {p.name}
                      </div>
                    )}
                    <div style={PT.plantMeta}>{p.crop} · {p.scans.length} scan{p.scans.length !== 1 ? "s" : ""}</div>
                    <div style={{ ...PT.trendChip, color: trend.color, background: trend.bg }}>
                      {trend.icon} {trend.label}
                    </div>
                  </div>
                  <button style={PT.deleteBtn}
                    onClick={e => { e.stopPropagation(); deletePlant(p.id); }}>🗑️</button>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div style={PT.timeline}>
            {!selectedPlant ? (
              <div style={PT.selectHint}>← Select a plant to see its health timeline</div>
            ) : (
              <>
                {/* Plant summary */}
                <div style={PT.timelineHeader}>
                  <div>
                    <div style={PT.timelinePlantName}>{selectedPlant.name}</div>
                    <div style={PT.timelinePlantMeta}>
                      {selectedPlant.crop} · Tracking since {new Date(selectedPlant.created).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  {(() => {
                    const trend = TREND_CONFIG[selectedPlant.trend] || TREND_CONFIG.new;
                    return (
                      <div style={{ ...PT.trendBadge, color: trend.color, background: trend.bg,
                        border: `1px solid ${trend.color}40` }}>
                        {trend.icon} {trend.label}
                      </div>
                    );
                  })()}
                </div>

                {/* Confidence chart */}
                {selectedPlant.scans.length > 1 && (
                  <div style={PT.chartBox}>
                    <div style={PT.chartTitle}>Disease Confidence Over Time</div>
                    <div style={PT.chartArea}>
                      {selectedPlant.scans.map((scan, i) => {
                        const height = scan.is_healthy ? 4 : Math.max(10, scan.confidence * 0.7);
                        const color  = scan.is_healthy ? "#4ade80"
                                     : scan.confidence > 80 ? "#f87171"
                                     : scan.confidence > 60 ? "#fb923c" : "#fbbf24";
                        return (
                          <div key={scan.id} style={PT.chartBarWrap}>
                            <div style={PT.chartBarLabel}>
                              {scan.is_healthy ? "✅" : `${scan.confidence.toFixed(0)}%`}
                            </div>
                            <div style={{ ...PT.chartBar, height: `${height}%`, background: color,
                              boxShadow: `0 0 8px ${color}60` }} />
                            <div style={PT.chartBarDate}>
                              {new Date(scan.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={PT.chartLegend}>
                      {[["#4ade80","Healthy"],["#fbbf24","Low severity"],["#fb923c","Medium"],["#f87171","High"]].map(([c,l]) => (
                        <div key={l} style={PT.chartLegendItem}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />
                          <span style={{ fontSize:10, color:"#6ee7b7" }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scan timeline */}
                <div style={PT.scanList}>
                  <div style={PT.scanListTitle}>Scan History ({selectedPlant.scans.length})</div>
                  {[...selectedPlant.scans].reverse().map((scan, i) => {
                    const isLatest = i === 0;
                    const sevColor = scan.is_healthy ? "#4ade80"
                                   : scan.confidence > 80 ? "#f87171"
                                   : scan.confidence > 60 ? "#fb923c" : "#fbbf24";
                    return (
                      <div key={scan.id} style={PT.scanItem}>
                        <div style={{ ...PT.scanDot, background: sevColor,
                          boxShadow: isLatest ? `0 0 10px ${sevColor}` : "none" }} />
                        <div style={PT.scanLine} />
                        <div style={PT.scanContent}>
                          {isLatest && <div style={PT.latestBadge}>Latest</div>}
                          <div style={PT.scanDisease}>{scan.disease}</div>
                          <div style={PT.scanMeta}>
                            {scan.is_healthy
                              ? <span style={{ color: "#4ade80" }}>✅ Plant is healthy</span>
                              : <span style={{ color: sevColor }}>{scan.confidence.toFixed(1)}% confidence</span>}
                            <span style={PT.scanTime}>
                              {new Date(scan.timestamp).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </span>
                          </div>
                          <button style={PT.scanDeleteBtn}
                            onClick={() => deleteScan(selectedPlant.id, scan.id)}>
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Advice */}
                {selectedPlant.scans.length >= 2 && (() => {
                  const trend = selectedPlant.trend;
                  const advice = {
                    improving:   { msg: "Treatment is working! Continue current regimen and monitor weekly.", icon: "💚" },
                    recovering:  { msg: "Great news — your plant shows signs of recovery!", icon: "🎉" },
                    recovered:   { msg: "Plant has fully recovered. Continue preventive care.", icon: "🎉" },
                    worsening:   { msg: "Disease is progressing. Consider changing treatment or consulting an expert.", icon: "🚨" },
                    worsened:    { msg: "Significant deterioration detected. Urgent expert consultation recommended.", icon: "⚠️" },
                    stable:      { msg: "Disease is stable. Treatment may need adjustment for full recovery.", icon: "🟡" },
                    stable_healthy: { msg: "Plant remains healthy. Keep up the preventive care!", icon: "✅" },
                  };
                  const a = advice[trend];
                  if (!a) return null;
                  return (
                    <div style={PT.adviceBox}>
                      <span style={PT.adviceIcon}>{a.icon}</span>
                      <span style={PT.adviceText}>{a.msg}</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const PT = {
  root: { fontFamily: "'Cabinet Grotesk', sans-serif", color: "#e2f5e6", paddingBottom: 40 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#166534,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(22,163,74,0.4)", flexShrink: 0 },
  headerTitle: { fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "#f0fdf4" },
  headerSub: { fontSize: 12, color: "#6ee7b7", marginTop: 2 },
  closeBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#a7f3d0", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'Cabinet Grotesk',sans-serif" },

  emptyState: { textAlign: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 20, fontWeight: 700, color: "#bbf7d0", marginBottom: 10 },
  emptySub: { fontSize: 14, color: "#6ee7b7", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" },

  body: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" },

  // Plant list
  plantList: { display: "flex", flexDirection: "column", gap: 10 },
  listTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 13, fontWeight: 700, color: "#4b7a57", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 },
  plantCard: { display: "flex", alignItems: "stretch", background: "rgba(10,40,18,0.6)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", position: "relative" },
  plantCardActive: { border: "1px solid rgba(74,222,128,0.4)", background: "rgba(10,40,18,0.9)", boxShadow: "0 0 20px rgba(74,222,128,0.1)" },
  trendBar: { width: 4, flexShrink: 0 },
  plantCardInner: { flex: 1, padding: "12px 12px 12px 14px" },
  plantName: { fontSize: 14, fontWeight: 700, color: "#d1fae5", marginBottom: 3 },
  plantMeta: { fontSize: 11, color: "#4b7a57", marginBottom: 6 },
  trendChip: { display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  deleteBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "0 10px", fontSize: 14, opacity: 0.4, color: "#f87171" },
  nameInput: { flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 6, padding: "4px 8px", color: "#e2f5e6", fontSize: 13, fontFamily: "'Cabinet Grotesk',sans-serif", outline: "none" },
  nameBtn: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 },

  // Timeline
  timeline: { background: "rgba(10,40,18,0.5)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 20, padding: "22px", backdropFilter: "blur(16px)", minHeight: 300 },
  selectHint: { color: "#4b7a57", fontSize: 14, textAlign: "center", paddingTop: 80 },
  timelineHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  timelinePlantName: { fontFamily: "'Clash Display',sans-serif", fontSize: 20, fontWeight: 700, color: "#f0fdf4", marginBottom: 4 },
  timelinePlantMeta: { fontSize: 12, color: "#6ee7b7" },
  trendBadge: { borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700 },

  // Chart
  chartBox: { background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: "16px", marginBottom: 20 },
  chartTitle: { fontSize: 12, color: "#4b7a57", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 },
  chartArea: { display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 },
  chartBarWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" },
  chartBarLabel: { fontSize: 10, color: "#6ee7b7", fontWeight: 700 },
  chartBar: { width: "100%", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", minHeight: 4 },
  chartBarDate: { fontSize: 9, color: "#4b7a57", textAlign: "center" },
  chartLegend: { display: "flex", gap: 12, flexWrap: "wrap" },
  chartLegendItem: { display: "flex", alignItems: "center", gap: 4 },

  // Scan list
  scanList: { marginBottom: 16 },
  scanListTitle: { fontSize: 12, color: "#4b7a57", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 },
  scanItem: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12, position: "relative" },
  scanDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 4 },
  scanLine: { position: "absolute", left: 5, top: 16, bottom: -12, width: 2, background: "rgba(74,222,128,0.1)" },
  scanContent: { flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 12px", position: "relative" },
  latestBadge: { display: "inline-block", background: "rgba(74,222,128,0.15)", color: "#4ade80", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700, marginBottom: 4 },
  scanDisease: { fontSize: 13, fontWeight: 600, color: "#d1fae5", marginBottom: 4 },
  scanMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 },
  scanTime: { color: "#4b7a57", fontSize: 11 },
  scanDeleteBtn: { position: "absolute", top: 8, right: 8, background: "transparent", border: "none", color: "#4b7a57", cursor: "pointer", fontSize: 12, padding: "2px 4px" },

  // Advice
  adviceBox: { display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "12px 14px" },
  adviceIcon: { fontSize: 18, flexShrink: 0 },
  adviceText: { fontSize: 13, color: "#a7f3d0", lineHeight: 1.6 },
};

// ── Add to Plant Modal Styles ───────────────────────────────────────────────
const PM = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "#0a1a0e", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "24px", width: "90%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" },
  modalHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  modalIcon: { fontSize: 28 },
  modalTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 18, fontWeight: 700, color: "#f0fdf4" },
  modalSub: { fontSize: 12, color: "#6ee7b7", marginTop: 2 },
  closeBtn: { marginLeft: "auto", background: "transparent", border: "none", color: "#6ee7b7", cursor: "pointer", fontSize: 18, padding: "4px" },
  modeTabs: { display: "flex", gap: 8, marginBottom: 16 },
  modeTab: { flex: 1, padding: "8px", borderRadius: 10, border: "1px solid rgba(74,222,128,0.2)", background: "transparent", color: "#6ee7b7", fontSize: 13, cursor: "pointer", fontFamily: "'Cabinet Grotesk',sans-serif" },
  modeTabActive: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80", fontWeight: 700 },
  plantList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto", marginBottom: 16 },
  plantItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 12, border: "1px solid rgba(74,222,128,0.1)", background: "rgba(0,0,0,0.2)", cursor: "pointer" },
  plantItemActive: { border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.1)" },
  plantTrendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  plantInfo: { flex: 1 },
  plantName: { fontSize: 14, fontWeight: 600, color: "#d1fae5" },
  plantMeta: { fontSize: 11, color: "#4b7a57" },
  plantTrend: { fontSize: 12, fontWeight: 600 },
  emptyMsg: { color: "#4b7a57", fontSize: 13, textAlign: "center", padding: "20px 0" },
  newPlantForm: { marginBottom: 16 },
  label: { display: "block", fontSize: 12, color: "#6ee7b7", fontWeight: 600, marginBottom: 6 },
  input: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: "10px 14px", color: "#e2f5e6", fontSize: 14, fontFamily: "'Cabinet Grotesk',sans-serif", outline: "none", boxSizing: "border-box" },
  newPlantHint: { fontSize: 11, color: "#4b7a57", marginTop: 6 },
  saveBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", borderRadius: 12, color: "#fff", fontFamily: "'Clash Display',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  saveBtnOff: { opacity: 0.4, cursor: "not-allowed" },
};