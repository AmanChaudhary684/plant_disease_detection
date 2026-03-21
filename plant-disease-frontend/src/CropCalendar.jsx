// CropCalendar.jsx — Seasonal Disease Risk Calendar
// DTI Project | LeafDoc AI | Unique Feature
// Shows month-by-month disease risk for detected disease

import { useState } from "react";

// ── Seasonal Risk Data for all 38 disease classes ─────────────────────────────
// Risk levels: 0=None, 1=Low, 2=Moderate, 3=High, 4=Critical
// Months: Jan=0, Feb=1, ... Dec=11
// Based on Indian agricultural seasons

const DISEASE_CALENDAR = {
  // ── APPLE ──────────────────────────────────────────────────────────────────
  "Apple___Apple_scab": {
    risk: [1, 1, 2, 4, 4, 3, 2, 2, 3, 2, 1, 1],
    peak_months: [3, 4],
    season_tip: "Most dangerous during March-May when apple blossoms. Apply fungicide at bud break.",
    region: "Himachal Pradesh, Uttarakhand, J&K",
  },
  "Apple___Black_rot": {
    risk: [0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0],
    peak_months: [5, 6],
    season_tip: "Peak in June-July monsoon. Remove mummified fruit before May.",
    region: "Himachal Pradesh, Uttarakhand",
  },
  "Apple___Cedar_apple_rust": {
    risk: [0, 0, 2, 4, 4, 2, 1, 1, 1, 0, 0, 0],
    peak_months: [3, 4],
    season_tip: "Spores release in April-May. Apply fungicide at pink bud stage.",
    region: "Himachal Pradesh, J&K",
  },
  "Apple___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Your apple plant is healthy! Monitor monthly and apply dormant spray in February.",
    region: "All apple-growing regions",
  },

  // ── BLUEBERRY ──────────────────────────────────────────────────────────────
  "Blueberry___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Blueberry is healthy. Maintain soil pH 4.5-5.5 year-round.",
    region: "Northeast India, Nilgiris",
  },

  // ── CHERRY ─────────────────────────────────────────────────────────────────
  "Cherry_(including_sour)___Powdery_mildew": {
    risk: [0, 1, 2, 3, 4, 3, 2, 2, 2, 1, 0, 0],
    peak_months: [4],
    season_tip: "Peak in April-May. Apply sulfur fungicide at bud break in March.",
    region: "Himachal Pradesh, J&K, Uttarakhand",
  },
  "Cherry_(including_sour)___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Cherry is healthy! Apply dormant copper spray in February.",
    region: "Himachal Pradesh, J&K",
  },

  // ── CORN ───────────────────────────────────────────────────────────────────
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
    risk: [0, 0, 0, 1, 2, 3, 4, 4, 3, 1, 0, 0],
    peak_months: [6, 7],
    season_tip: "Critical during Kharif season July-August. Apply fungicide at tasseling stage.",
    region: "Karnataka, Maharashtra, MP, UP",
  },
  "Corn_(maize)___Common_rust_": {
    risk: [0, 0, 0, 0, 1, 2, 3, 4, 3, 1, 0, 0],
    peak_months: [7],
    season_tip: "Peak in August monsoon. Cool humid nights favor spread. Scout weekly.",
    region: "Punjab, Haryana, UP, Bihar",
  },
  "Corn_(maize)___Northern_Leaf_Blight": {
    risk: [0, 0, 0, 0, 1, 3, 4, 4, 3, 1, 0, 0],
    peak_months: [6, 7],
    season_tip: "Most damaging in Kharif July-August. Plant resistant hybrids before June.",
    region: "All corn-growing states",
  },
  "Corn_(maize)___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Corn is healthy! Scout weekly during monsoon for early signs.",
    region: "All corn-growing states",
  },

  // ── GRAPE ──────────────────────────────────────────────────────────────────
  "Grape___Black_rot": {
    risk: [0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0],
    peak_months: [5, 6],
    season_tip: "Peak during June-July monsoon. Remove mummies in March before bud break.",
    region: "Maharashtra, Karnataka, Andhra Pradesh",
  },
  "Grape___Esca_(Black_Measles)": {
    risk: [1, 1, 2, 2, 3, 4, 4, 3, 2, 2, 1, 1],
    peak_months: [5, 6, 7],
    season_tip: "Apoplexy (sudden collapse) peaks in hot summer June-August. Seal pruning wounds in January.",
    region: "Maharashtra (Nashik), Karnataka",
  },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
    risk: [0, 0, 1, 2, 3, 4, 4, 4, 3, 2, 1, 0],
    peak_months: [5, 6, 7],
    season_tip: "Critical during humid monsoon June-August. Apply copper spray before rains.",
    region: "Maharashtra, Karnataka, Tamil Nadu",
  },
  "Grape___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Grapevine is healthy! Apply dormant sulfur spray in December-January.",
    region: "Maharashtra, Karnataka, AP",
  },

  // ── ORANGE ─────────────────────────────────────────────────────────────────
  "Orange___Haunglongbing_(Citrus_greening)": {
    risk: [2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2],
    peak_months: [4, 5, 6, 7],
    season_tip: "Year-round threat — psyllid vector most active April-August. Control insects aggressively.",
    region: "Maharashtra, Punjab, AP, Karnataka",
  },

  // ── PEACH ──────────────────────────────────────────────────────────────────
  "Peach___Bacterial_spot": {
    risk: [0, 0, 1, 3, 4, 4, 3, 2, 2, 1, 0, 0],
    peak_months: [4, 5],
    season_tip: "Peak April-June. Apply copper bactericide at petal fall in March-April.",
    region: "Himachal Pradesh, Uttarakhand, J&K",
  },
  "Peach___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Peach is healthy! Apply dormant copper spray before bud swell in February.",
    region: "Himachal Pradesh, J&K",
  },

  // ── PEPPER ─────────────────────────────────────────────────────────────────
  "Pepper__bell___Bacterial_spot": {
    risk: [1, 1, 2, 3, 4, 4, 4, 4, 3, 2, 1, 1],
    peak_months: [5, 6, 7],
    season_tip: "Critical during monsoon June-August. Use drip irrigation and copper spray weekly.",
    region: "Karnataka, AP, Maharashtra, UP",
  },
  "Pepper__bell___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Pepper is healthy! Increase monitoring frequency during monsoon months.",
    region: "Karnataka, AP, Maharashtra",
  },

  // ── POTATO ─────────────────────────────────────────────────────────────────
  "Potato___Early_blight": {
    risk: [2, 2, 3, 3, 2, 1, 1, 1, 2, 3, 3, 2],
    peak_months: [2, 3, 9, 10],
    season_tip: "Two peak periods: March-April (Rabi crop) and Oct-Nov (Kharif). Apply Mancozeb before symptoms.",
    region: "UP, Bihar, West Bengal, Punjab",
  },
  "Potato___Late_blight": {
    risk: [3, 3, 2, 1, 0, 0, 0, 0, 1, 3, 4, 4],
    peak_months: [10, 11, 0],
    season_tip: "Most devastating Oct-Jan in Rabi season. Apply Ridomil Gold preventively before cool+wet weather.",
    region: "UP, Bihar, West Bengal, Hills",
  },
  "Potato___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Potato is healthy! Watch for late blight during October-November monsoon retreat.",
    region: "UP, Bihar, West Bengal, Punjab",
  },

  // ── RASPBERRY ──────────────────────────────────────────────────────────────
  "Raspberry___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Raspberry is healthy! Prune old canes after fruiting.",
    region: "Himachal Pradesh, Uttarakhand",
  },

  // ── SOYBEAN ────────────────────────────────────────────────────────────────
  "Soybean___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Soybean is healthy! Kharif crop — monitor July-September for sudden death syndrome.",
    region: "MP, Maharashtra, Rajasthan",
  },

  // ── SQUASH ─────────────────────────────────────────────────────────────────
  "Squash___Powdery_mildew": {
    risk: [1, 1, 2, 3, 4, 3, 2, 2, 3, 4, 3, 1],
    peak_months: [4, 9],
    season_tip: "Two peaks: May (hot+dry) and October (post-monsoon). Apply neem oil weekly as preventive.",
    region: "All cucurbit-growing regions of India",
  },

  // ── STRAWBERRY ─────────────────────────────────────────────────────────────
  "Strawberry___Leaf_scorch": {
    risk: [2, 2, 3, 3, 2, 1, 1, 1, 2, 3, 3, 2],
    peak_months: [2, 3, 9, 10],
    season_tip: "Peak March-April and October-November. Use drip irrigation — avoid wetting foliage.",
    region: "Maharashtra (Mahabaleshwar), HP, UP",
  },
  "Strawberry___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Strawberry is healthy! Increase monitoring in March-April fruiting season.",
    region: "Maharashtra, HP, UP Hills",
  },

  // ── TOMATO ─────────────────────────────────────────────────────────────────
  "Tomato___Bacterial_spot": {
    risk: [1, 1, 2, 3, 4, 4, 4, 4, 3, 2, 1, 1],
    peak_months: [5, 6, 7],
    season_tip: "Most severe during June-August monsoon. Stake plants and use drip irrigation.",
    region: "Karnataka, AP, Maharashtra, UP, TN",
  },
  "Tomato___Early_blight": {
    risk: [2, 2, 3, 3, 3, 2, 2, 2, 3, 3, 2, 2],
    peak_months: [2, 3, 4, 9],
    season_tip: "Two peaks: March-May and September-October. Remove lower leaves when spotted.",
    region: "All tomato-growing states",
  },
  "Tomato___Late_blight": {
    risk: [3, 2, 1, 0, 0, 0, 2, 3, 4, 4, 3, 3],
    peak_months: [8, 9],
    season_tip: "Most dangerous August-October monsoon retreat. Apply Ridomil Gold preventively.",
    region: "UP, Bihar, West Bengal, Hills",
  },
  "Tomato___Leaf_Mold": {
    risk: [1, 1, 2, 2, 3, 4, 4, 4, 3, 2, 1, 1],
    peak_months: [5, 6, 7],
    season_tip: "Peak June-August when humidity above 85%. Ensure greenhouse ventilation.",
    region: "All greenhouse tomato regions",
  },
  "Tomato___Septoria_leaf_spot": {
    risk: [1, 1, 2, 3, 4, 4, 4, 3, 3, 2, 1, 1],
    peak_months: [4, 5, 6],
    season_tip: "Peak May-July. Use drip irrigation and mulch soil to prevent splash.",
    region: "All tomato-growing states",
  },
  "Tomato___Spider_mites_Two_spotted_spider_mite": {
    risk: [1, 1, 2, 3, 4, 4, 3, 2, 2, 3, 2, 1],
    peak_months: [4, 5],
    season_tip: "Peak April-June in hot dry weather. Spray leaf undersides with water jets weekly.",
    region: "All tomato-growing states, especially AP and Karnataka",
  },
  "Tomato___Target_Spot": {
    risk: [1, 1, 2, 2, 3, 4, 4, 4, 3, 2, 1, 1],
    peak_months: [5, 6, 7],
    season_tip: "Peak June-August. Use combination spray Mancozeb + Carbendazim preventively.",
    region: "Karnataka, AP, Tamil Nadu, Maharashtra",
  },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
    risk: [1, 1, 2, 3, 4, 4, 4, 4, 3, 2, 1, 1],
    peak_months: [4, 5, 6, 7],
    season_tip: "Whitefly most active April-August. Use 50-mesh nets on seedlings. Plant early.",
    region: "AP, Karnataka, Tamil Nadu, Maharashtra",
  },
  "Tomato___Tomato_mosaic_virus": {
    risk: [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1],
    peak_months: [4, 5, 6, 7],
    season_tip: "Spreads year-round via contact. Always disinfect tools. Highest risk during transplanting.",
    region: "All tomato-growing states",
  },
  "Tomato___healthy": {
    risk: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak_months: [],
    season_tip: "Tomato is healthy! Preventive neem oil spray every 15 days keeps most diseases away.",
    region: "All tomato-growing states",
  },
};

// Fallback for any unmapped class
const DEFAULT_CALENDAR = {
  risk: [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1],
  peak_months: [4, 5, 6, 7],
  season_tip: "Monitor your crop closely during monsoon season (June-September) when disease pressure is highest.",
  region: "India",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RISK_CONFIG = {
  0: { label: "None",     color: "rgba(255,255,255,0.06)", text: "#4b7a57",  border: "rgba(255,255,255,0.08)" },
  1: { label: "Low",      color: "rgba(34,197,94,0.25)",  text: "#4ade80",  border: "rgba(34,197,94,0.4)"    },
  2: { label: "Moderate", color: "rgba(234,179,8,0.25)",  text: "#fbbf24",  border: "rgba(234,179,8,0.4)"    },
  3: { label: "High",     color: "rgba(249,115,22,0.35)", text: "#fb923c",  border: "rgba(249,115,22,0.5)"   },
  4: { label: "Critical", color: "rgba(239,68,68,0.4)",   text: "#f87171",  border: "rgba(239,68,68,0.6)"    },
};

export default function CropCalendar({ diseaseClassId, lang }) {
  const currentMonth = new Date().getMonth(); // 0-11
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Get calendar data for this disease
  const calData = DISEASE_CALENDAR[diseaseClassId] || DEFAULT_CALENDAR;

  const activeMonth = hoveredMonth !== null ? hoveredMonth : currentMonth;
  const activeRisk  = calData.risk[activeMonth];
  const activeRC    = RISK_CONFIG[activeRisk];

  return (
    <div style={C.card}>
      {/* Header */}
      <div style={C.header}>
        <span style={{ fontSize: 18 }}>📅</span>
        <span style={C.headerTitle}>
          {lang === "hi" ? "मौसमी जोखिम कैलेंडर" : "Seasonal Risk Calendar"}
        </span>
        <span style={C.badge}>
          {lang === "hi" ? "भारत" : "India"}
        </span>
      </div>

      <p style={C.region}>
        📍 {lang === "hi" ? "क्षेत्र:" : "Region:"} {calData.region}
      </p>

      {/* Month grid */}
      <div style={C.monthGrid}>
        {MONTHS.map((month, idx) => {
          const risk = calData.risk[idx];
          const rc   = RISK_CONFIG[risk];
          const isCurrent  = idx === currentMonth;
          const isPeak     = calData.peak_months.includes(idx);
          const isHovered  = hoveredMonth === idx;

          return (
            <div
              key={month}
              style={{
                ...C.monthCell,
                background: rc.color,
                border: isCurrent
                  ? "2px solid #4ade80"
                  : isHovered
                  ? `2px solid ${rc.border}`
                  : `1px solid ${rc.border}`,
                transform: isHovered ? "scale(1.08)" : "scale(1)",
                boxShadow: isCurrent ? "0 0 12px rgba(74,222,128,0.4)" : "none",
              }}
              onMouseEnter={() => setHoveredMonth(idx)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div style={{ ...C.monthLabel, color: rc.text }}>{month}</div>
              {isPeak && <div style={C.peakDot} title="Peak season" />}
              {isCurrent && <div style={C.currentDot} title="Current month" />}
            </div>
          );
        })}
      </div>

      {/* Active month detail */}
      <div style={{ ...C.detailBox, background: activeRC.color, border: `1px solid ${activeRC.border}` }}>
        <div style={C.detailRow}>
          <span style={{ ...C.detailMonth, color: activeRC.text }}>
            {MONTHS[activeMonth]}
            {activeMonth === currentMonth && (
              <span style={C.nowBadge}>{lang === "hi" ? " अभी" : " NOW"}</span>
            )}
          </span>
          <span style={{ ...C.detailRisk, color: activeRC.text }}>
            {activeRC.label} {lang === "hi" ? "जोखिम" : "Risk"}
          </span>
        </div>
        <div style={C.riskBar}>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              style={{
                ...C.riskBarSegment,
                background: level <= activeRisk ? activeRC.border : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Season tip */}
      <div style={C.tipBox}>
        <div style={C.tipTitle}>
          💡 {lang === "hi" ? "मौसमी सलाह" : "Seasonal Advice"}
        </div>
        <div style={C.tipText}>{calData.season_tip}</div>
      </div>

      {/* Legend */}
      <div style={C.legend}>
        {Object.entries(RISK_CONFIG).filter(([k]) => k !== "0").map(([level, rc]) => (
          <div key={level} style={C.legendItem}>
            <div style={{ ...C.legendDot, background: rc.border }} />
            <span style={{ ...C.legendLabel, color: rc.text }}>{rc.label}</span>
          </div>
        ))}
        <div style={C.legendItem}>
          <div style={{ ...C.legendDot, background: "#4ade80", borderRadius: "50%" }} />
          <span style={C.legendLabel}>{lang === "hi" ? "अभी" : "Current"}</span>
        </div>
        <div style={C.legendItem}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", marginRight: 4 }} />
          <span style={C.legendLabel}>{lang === "hi" ? "चरम" : "Peak"}</span>
        </div>
      </div>
    </div>
  );
}

const C = {
  card: { background: "rgba(10,40,18,0.6)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 18, padding: "20px", backdropFilter: "blur(16px)" },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  headerTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 15, fontWeight: 700, color: "#bbf7d0", flex: 1 },
  badge: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 },
  region: { fontSize: 11, color: "#6ee7b7", marginBottom: 14 },
  monthGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 12 },
  monthCell: { borderRadius: 8, padding: "8px 4px", textAlign: "center", cursor: "default", transition: "all 0.15s ease", position: "relative" },
  monthLabel: { fontSize: 11, fontWeight: 700 },
  peakDot: { width: 4, height: 4, borderRadius: "50%", background: "#f87171", margin: "2px auto 0", boxShadow: "0 0 4px #f87171" },
  currentDot: { width: 4, height: 4, borderRadius: "50%", background: "#4ade80", margin: "2px auto 0", boxShadow: "0 0 6px #4ade80" },
  detailBox: { borderRadius: 12, padding: "12px 14px", marginBottom: 10 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  detailMonth: { fontSize: 15, fontWeight: 800, fontFamily: "'Clash Display',sans-serif" },
  nowBadge: { fontSize: 10, background: "rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 8, padding: "1px 6px", marginLeft: 6, fontWeight: 700 },
  detailRisk: { fontSize: 13, fontWeight: 700 },
  riskBar: { display: "flex", gap: 4 },
  riskBarSegment: { flex: 1, height: 5, borderRadius: 3, transition: "background 0.3s ease" },
  tipBox: { background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 },
  tipTitle: { fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" },
  tipText: { fontSize: 12, color: "#a7f3d0", lineHeight: 1.65 },
  legend: { display: "flex", gap: 12, flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2, marginRight: 2 },
  legendLabel: { fontSize: 10, color: "#6ee7b7" },
};