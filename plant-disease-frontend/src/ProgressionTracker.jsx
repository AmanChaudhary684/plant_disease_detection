/**
 * ProgressionTracker.jsx — LeafDoc AI
 * DTI Project | White theme | Invalid Date fixed | Line chart added
 */

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "leafdoc_plants";

// ── Helpers ───────────────────────────────────────────────────────────────
function loadPlants() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function savePlants(plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

// ── FIXED: Safe date parser — handles ISO strings, timestamps, undefined ──
function safeDate(val) {
  if (!val) return new Date();
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const n = Number(val);
  if (!isNaN(n)) return new Date(n);
  return new Date();
}

function formatDate(val) {
  return safeDate(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatDateTime(val) {
  return safeDate(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function timeAgo(val) {
  const diff = (Date.now() - safeDate(val).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function getTrend(scans) {
  if (scans.length < 2) return "new";
  const last = scans[scans.length - 1];
  const prev = scans[scans.length - 2];
  if (last.is_healthy && !prev.is_healthy) return "recovered";
  if (!last.is_healthy && prev.is_healthy) return "worsened";
  if (last.is_healthy && prev.is_healthy) return "stable_healthy";
  const diff = last.confidence - prev.confidence;
  if (diff > 10) return "worsening";
  if (diff < -10) return "improving";
  return "stable";
}

// ── Note Field Component ──────────────────────────────────────────────────
function NoteField({ scanId, plantId, initialNote, onSave }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote]       = useState(initialNote);
  const [saved, setSaved]     = useState(false);

  const handleSave = () => {
    onSave(note);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!editing && !note) {
    return (
      <button
        style={{ marginTop:8, fontSize:11, color:"#9ca3af", background:"transparent", border:"1px dashed #e5e7eb", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" }}
        onClick={() => setEditing(true)}>
        + Add treatment note
      </button>
    );
  }

  if (!editing && note) {
    return (
      <div style={{ marginTop:8, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6, padding:"6px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#16a34a", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>💊 Treatment Applied</div>
          <div style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{note}</div>
        </div>
        <button
          style={{ fontSize:11, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", flexShrink:0, padding:"2px 4px" }}
          onClick={() => setEditing(true)}>✏️</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop:8 }}>
      <textarea
        style={{ width:"100%", border:"1px solid #bbf7d0", borderRadius:8, padding:"8px 10px", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"#374151", resize:"vertical", outline:"none", minHeight:60, boxSizing:"border-box", background:"#f9fafb" }}
        placeholder="e.g. Sprayed Mancozeb 2.5g/L, removed lower leaves..."
        value={note}
        onChange={e => setNote(e.target.value)}
        autoFocus
      />
      <div style={{ display:"flex", gap:6, marginTop:4 }}>
        <button
          style={{ flex:1, padding:"6px", background:"#16a34a", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          onClick={handleSave}>
          {saved ? "✅ Saved!" : "💾 Save Note"}
        </button>
        <button
          style={{ padding:"6px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          onClick={() => { setNote(initialNote); setEditing(false); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const TREND_CONFIG = {
  new:            { icon: "🆕", label: "New Plant",  color: "#16a34a",  bg: "#f0fdf4",  border: "#bbf7d0" },
  recovered:      { icon: "🎉", label: "Recovered!", color: "#16a34a",  bg: "#f0fdf4",  border: "#bbf7d0" },
  improving:      { icon: "📈", label: "Improving",  color: "#16a34a",  bg: "#f0fdf4",  border: "#bbf7d0" },
  stable_healthy: { icon: "✅", label: "Healthy",    color: "#16a34a",  bg: "#f0fdf4",  border: "#bbf7d0" },
  stable:         { icon: "➡️", label: "Stable",     color: "#ca8a04",  bg: "#fefce8",  border: "#fde047" },
  worsening:      { icon: "📉", label: "Worsening",  color: "#ef4444",  bg: "#fef2f2",  border: "#fecaca" },
  worsened:       { icon: "⚠️", label: "Got Worse",  color: "#ea580c",  bg: "#fff7ed",  border: "#fdba74" },
};

// ── Save scan to plant (exported for ResultPage) ───────────────────────────
export function saveToPlant(result, plantId) {
  const plants = loadPlants();
  const scan = {
    id:         Date.now(),
    timestamp:  new Date(result.timestamp || Date.now()).toISOString(),
    disease:    result.diagnosis.top_prediction.display_name,
    disease_id: result.diagnosis.top_prediction.class_id,
    confidence: result.diagnosis.top_prediction.confidence,
    is_healthy: result.diagnosis.is_healthy,
    severity:   result.disease_info?.severity || "Unknown",
    notes:      "",   // ← farmer fills this in later
  };

  if (plantId) {
    const idx = plants.findIndex(p => p.id === plantId);
    if (idx !== -1) {
      plants[idx].scans.push(scan);
      plants[idx].last_updated = scan.timestamp;
      plants[idx].trend = getTrend(plants[idx].scans);
      savePlants(plants);
      return plants[idx];
    }
  }

  const newPlant = {
    id:           Date.now(),
    name:         `Plant ${plants.length + 1}`,
    crop:         scan.disease_id.split("___")[0].split("_")[0],
    created:      new Date().toISOString(),
    last_updated: new Date().toISOString(),
    trend:        "new",
    scans:        [scan],
  };
  plants.unshift(newPlant);
  savePlants(plants);
  return newPlant;
}

// ── SVG Line Chart ────────────────────────────────────────────────────────
function LineChart({ scans }) {
  if (scans.length < 2) return null;

  const W = 600, H = 160, PAD = { top: 20, right: 20, bottom: 40, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = scans.map(s => s.is_healthy ? 0 : s.confidence);
  const maxVal = Math.max(...values, 100);
  const minVal = 0;

  const xScale = (i) => PAD.left + (i / (scans.length - 1)) * innerW;
  const yScale = (v) => PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const points = scans.map((s, i) => `${xScale(i)},${yScale(values[i])}`).join(" ");

  // Gradient fill path
  const fillPath = `M${xScale(0)},${yScale(values[0])} ` +
    scans.map((s, i) => `L${xScale(i)},${yScale(values[i])}`).join(" ") +
    ` L${xScale(scans.length-1)},${PAD.top + innerH} L${xScale(0)},${PAD.top + innerH} Z`;

  const getColor = (v) => v === 0 ? "#16a34a" : v > 80 ? "#ef4444" : v > 60 ? "#ea580c" : "#ca8a04";

  // Y axis labels
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map(tick => (
        <g key={tick}>
          <line
            x1={PAD.left} y1={yScale(tick)}
            x2={PAD.left + innerW} y2={yScale(tick)}
            stroke="#f3f4f6" strokeWidth="1"
          />
          <text x={PAD.left - 6} y={yScale(tick) + 4} textAnchor="end"
            fontSize="10" fill="#9ca3af">{tick}%</text>
        </g>
      ))}

      {/* Fill */}
      <path d={fillPath} fill="url(#chartFill)" />

      {/* Line */}
      <polyline fill="none" stroke="#ef4444" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" points={points} />

      {/* Dots + X labels */}
      {scans.map((s, i) => {
        const x = xScale(i);
        const y = yScale(values[i]);
        const color = getColor(values[i]);
        const label = safeDate(s.timestamp).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r={5} fill={color} stroke="#fff" strokeWidth="2" />
            {/* Value tooltip above dot */}
            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
              {s.is_healthy ? "✓" : `${values[i].toFixed(0)}%`}
            </text>
            {/* X axis date label */}
            <text x={x} y={PAD.top + innerH + 18} textAnchor="middle" fontSize="9" fill="#9ca3af">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Add to Plant Modal ────────────────────────────────────────────────────
export function AddToPlantModal({ result, onSave, onClose }) {
  const [plants, setPlants]   = useState(loadPlants);
  const [selected, setSelected] = useState(null);
  const [newName, setNewName] = useState("");
  const [mode, setMode]       = useState(plants.length === 0 ? "new" : "existing");

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
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={e => e.stopPropagation()}>
        <div style={M.header}>
          <div>
            <div style={M.title}>📊 Track Disease Progression</div>
            <div style={M.sub}>Save this scan to monitor your plant over time</div>
          </div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={M.tabs}>
          {["existing","new"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ ...M.tab, ...(mode === m ? M.tabActive : {}) }}>
              {m === "existing" ? "Add to Existing Plant" : "+ New Plant"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          plants.length === 0 ? (
            <div style={M.emptyMsg}>No plants yet — create a new plant first!</div>
          ) : (
            <div style={M.plantList}>
              {plants.map(p => {
                const trend = TREND_CONFIG[p.trend] || TREND_CONFIG.new;
                return (
                  <div key={p.id}
                    style={{ ...M.plantItem, ...(selected === p.id ? M.plantItemActive : {}) }}
                    onClick={() => setSelected(p.id)}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:trend.color, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={M.plantName}>{p.name}</div>
                      <div style={M.plantMeta}>{p.scans.length} scans · {timeAgo(p.last_updated)}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:trend.color }}>{trend.icon} {trend.label}</div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div style={{ marginBottom:16 }}>
            <label style={M.label}>Plant nickname (optional)</label>
            <input style={M.input}
              placeholder="e.g. Backyard Tomato, Pot #3..."
              value={newName}
              onChange={e => setNewName(e.target.value)} />
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>
              Creates a new plant timeline starting with this scan.
            </div>
          </div>
        )}

        <button
          style={{ ...M.saveBtn, ...(mode === "existing" && !selected ? M.saveBtnOff : {}) }}
          disabled={mode === "existing" && !selected}
          onClick={handleSave}>
          📊 Save to Progression Tracker
        </button>
      </div>
    </div>
  );
}

// ── Main Progression Tracker ──────────────────────────────────────────────
export default function ProgressionTracker({ onClose }) {
  const [plants, setPlants]           = useState(loadPlants);
  const [selected, setSelected]       = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput]     = useState("");

  const refresh = () => setPlants(loadPlants());

  const deletePlant = (id) => {
    savePlants(loadPlants().filter(p => p.id !== id));
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
    setEditingName(null); setNameInput(""); refresh();
  };

  const selectedPlant = plants.find(p => p.id === selected?.id);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#111827", paddingBottom:40 }}>

      {/* Page header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"inline-block", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"4px 14px", fontSize:12, color:"#16a34a", fontWeight:600, marginBottom:10 }}>
            📊 Progression Tracker
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3vw,32px)", fontWeight:800, color:"#111827" }}>
            Disease Progression Tracker
          </h1>
          <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
            Monitor your plants over time · {plants.length} plant{plants.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        {onClose && (
          <button style={{ background:"#fff", border:"1px solid #e5e7eb", color:"#374151", borderRadius:10, padding:"8px 16px", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
            onClick={onClose}>✕ Close</button>
        )}
      </div>

      {plants.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 24px", background:"#fff", borderRadius:20, border:"1px solid #e5e7eb" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🌱</div>
          <div style={{ fontSize:18, fontWeight:600, color:"#374151", marginBottom:8 }}>No plants tracked yet</div>
          <div style={{ fontSize:14, color:"#9ca3af", lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>
            After scanning a leaf, click <strong>"📊 Track Progression"</strong> on the result page to start monitoring your plant's health over time.
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20, alignItems:"start" }}>

          {/* Plant list */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
              Your Plants
            </div>
            {plants.map(p => {
              const trend = TREND_CONFIG[p.trend] || TREND_CONFIG.new;
              const isSelected = selectedPlant?.id === p.id;
              return (
                <div key={p.id}
                  style={{ background:"#fff", border: isSelected ? `2px solid ${trend.color}` : "1px solid #e5e7eb", borderRadius:14, overflow:"hidden", cursor:"pointer", boxShadow: isSelected ? `0 0 0 3px ${trend.color}20` : "0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.15s" }}
                  onClick={() => setSelected(p)}>
                  <div style={{ height:4, background:trend.color }} />
                  <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1 }}>
                      {editingName === p.id ? (
                        <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
                          <input style={{ flex:1, border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 8px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                            value={nameInput} autoFocus
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && renamePlant(p.id)} />
                          <button style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:12 }} onClick={() => renamePlant(p.id)}>✓</button>
                          <button style={{ background:"#f9fafb", border:"1px solid #e5e7eb", color:"#6b7280", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:12 }} onClick={() => setEditingName(null)}>✕</button>
                        </div>
                      ) : (
                        <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:3 }}
                          onDoubleClick={e => { e.stopPropagation(); setEditingName(p.id); setNameInput(p.name); }}>
                          {p.name}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{p.crop} · {p.scans.length} scan{p.scans.length !== 1 ? "s" : ""}</div>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, background:trend.bg, border:`1px solid ${trend.border}`, borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:600, color:trend.color }}>
                        {trend.icon} {trend.label}
                      </div>
                    </div>
                    <button style={{ background:"transparent", border:"none", cursor:"pointer", color:"#fca5a5", fontSize:16, padding:"4px", opacity:0.6 }}
                      onClick={e => { e.stopPropagation(); deletePlant(p.id); }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline panel */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:20, padding:24, minHeight:300 }}>
            {!selectedPlant ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af", fontSize:14 }}>
                ← Select a plant to see its health timeline
              </div>
            ) : (() => {
              const trend = TREND_CONFIG[selectedPlant.trend] || TREND_CONFIG.new;
              return (
                <>
                  {/* Plant header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:"#111827", marginBottom:4 }}>
                        {selectedPlant.name}
                      </div>
                      {/* FIXED: uses safeDate → formatDate */}
                      <div style={{ fontSize:12, color:"#9ca3af" }}>
                        {selectedPlant.crop} · Tracking since {formatDate(selectedPlant.created)}
                      </div>
                    </div>
                    <div style={{ background:trend.bg, border:`1px solid ${trend.border}`, color:trend.color, borderRadius:20, padding:"6px 16px", fontSize:13, fontWeight:700 }}>
                      {trend.icon} {trend.label}
                    </div>
                  </div>

                  {/* LINE CHART */}
                  {selectedPlant.scans.length >= 2 && (
                    <div style={{ background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:14, padding:"16px 12px", marginBottom:20 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                        Disease Confidence Over Time
                      </div>
                      <LineChart scans={selectedPlant.scans} />
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:8 }}>
                        {[["#16a34a","Healthy (0%)"],["#ca8a04","Low (<60%)"],["#ea580c","Medium (60–80%)"],["#ef4444","High (>80%)"]].map(([c,l]) => (
                          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#9ca3af" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scan timeline */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>
                      Scan History ({selectedPlant.scans.length})
                    </div>
                    {[...selectedPlant.scans].reverse().map((scan, i) => {
                      const isLatest = i === 0;
                      const sevColor = scan.is_healthy ? "#16a34a" : scan.confidence > 80 ? "#ef4444" : scan.confidence > 60 ? "#ea580c" : "#ca8a04";
                      const sevBg    = scan.is_healthy ? "#f0fdf4" : scan.confidence > 80 ? "#fef2f2" : scan.confidence > 60 ? "#fff7ed" : "#fefce8";
                      return (
                        <div key={scan.id} style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, marginTop:4 }}>
                            <div style={{ width:12, height:12, borderRadius:"50%", background:sevColor, boxShadow: isLatest ? `0 0 8px ${sevColor}` : "none" }} />
                            {i < selectedPlant.scans.length - 1 && (
                              <div style={{ width:2, height:24, background:"#f3f4f6", marginTop:3 }} />
                            )}
                          </div>
                          <div style={{ flex:1, background:sevBg, border:`1px solid ${sevColor}30`, borderRadius:12, padding:"10px 14px", position:"relative" }}>
                            {isLatest && (
                              <div style={{ display:"inline-block", background:sevColor, color:"#fff", borderRadius:20, padding:"1px 8px", fontSize:10, fontWeight:700, marginBottom:4 }}>Latest</div>
                            )}
                            <div style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:4 }}>{scan.disease}</div>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12 }}>
                              {scan.is_healthy
                                ? <span style={{ color:"#16a34a", fontWeight:600 }}>✅ Healthy</span>
                                : <span style={{ color:sevColor, fontWeight:600 }}>{scan.confidence.toFixed(1)}% confidence</span>}
                              {/* FIXED: uses formatDateTime → safeDate */}
                              <span style={{ color:"#9ca3af", fontSize:11 }}>{formatDateTime(scan.timestamp)}</span>
                            </div>
                            <button style={{ position:"absolute", top:8, right:8, background:"transparent", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:12 }}
                              onClick={() => deleteScan(selectedPlant.id, scan.id)}>✕</button>

                            {/* Treatment notes */}
                            <NoteField
                              scanId={scan.id}
                              plantId={selectedPlant.id}
                              initialNote={scan.notes || ""}
                              onSave={(note) => {
                                const all = loadPlants();
                                const pi  = all.findIndex(p => p.id === selectedPlant.id);
                                if (pi === -1) return;
                                const si  = all[pi].scans.findIndex(s => s.id === scan.id);
                                if (si === -1) return;
                                all[pi].scans[si].notes = note;
                                savePlants(all);
                                refresh();
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Advice box */}
                  {selectedPlant.scans.length >= 2 && (() => {
                    const advice = {
                      improving:      { msg:"Treatment is working! Continue current regimen and monitor weekly.", icon:"💚", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
                      recovered:      { msg:"Plant has fully recovered. Continue preventive care.", icon:"🎉", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
                      worsening:      { msg:"Disease is progressing. Consider changing treatment or consulting an expert.", icon:"🚨", color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
                      worsened:       { msg:"Significant deterioration detected. Urgent expert consultation recommended.", icon:"⚠️", color:"#ea580c", bg:"#fff7ed", border:"#fdba74" },
                      stable:         { msg:"Disease is stable. Treatment may need adjustment for full recovery.", icon:"🟡", color:"#ca8a04", bg:"#fefce8", border:"#fde047" },
                      stable_healthy: { msg:"Plant remains healthy. Keep up the preventive care!", icon:"✅", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
                    };
                    const a = advice[selectedPlant.trend];
                    if (!a) return null;
                    return (
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start", background:a.bg, border:`1px solid ${a.border}`, borderRadius:12, padding:"12px 16px" }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
                        <span style={{ fontSize:13, color:a.color, lineHeight:1.6, fontWeight:500 }}>{a.msg}</span>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal styles ──────────────────────────────────────────────────────────
const M = {
  overlay:        { position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)", padding:20 },
  modal:          { background:"#fff", borderRadius:20, padding:24, width:"100%", maxWidth:480, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" },
  header:         { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  title:          { fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:"#111827", marginBottom:4 },
  sub:            { fontSize:12, color:"#9ca3af" },
  closeBtn:       { background:"#f9fafb", border:"1px solid #e5e7eb", color:"#6b7280", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 },
  tabs:           { display:"flex", gap:8, marginBottom:16 },
  tab:            { flex:1, padding:"8px", borderRadius:10, border:"1px solid #e5e7eb", background:"transparent", color:"#6b7280", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  tabActive:      { background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", fontWeight:700 },
  plantList:      { display:"flex", flexDirection:"column", gap:8, maxHeight:220, overflowY:"auto", marginBottom:16 },
  plantItem:      { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer" },
  plantItemActive:{ border:"1px solid #bbf7d0", background:"#f0fdf4" },
  plantName:      { fontSize:14, fontWeight:600, color:"#111827" },
  plantMeta:      { fontSize:11, color:"#9ca3af" },
  emptyMsg:       { color:"#9ca3af", fontSize:13, textAlign:"center", padding:"20px 0", marginBottom:16 },
  label:          { display:"block", fontSize:12, color:"#374151", fontWeight:600, marginBottom:6 },
  input:          { width:"100%", border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 14px", color:"#111827", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" },
  saveBtn:        { width:"100%", padding:"13px", background:"#16a34a", border:"none", borderRadius:12, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:8 },
  saveBtnOff:     { opacity:0.4, cursor:"not-allowed", background:"#9ca3af" },
};