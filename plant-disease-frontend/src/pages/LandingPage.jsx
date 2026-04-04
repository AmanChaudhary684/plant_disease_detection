// pages/LandingPage.jsx — Beautiful marketing homepage
import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";
import { useAuth } from "../AuthContext";

const STATS = [
  { icon: "🎯", value: "73.19%",  label: "Real-World Accuracy" },
  { icon: "🌾", value: "38",      label: "Disease Classes" },
  { icon: "⚡", value: "<2s",     label: "Diagnosis Time" },
  { icon: "🌍", value: "14",      label: "Crop Types" },
];

const FEATURES = [
  { icon: "🔬", title: "AI Diagnosis",         desc: "SWIN Transformer model trained on 50,000+ images gives instant diagnosis with 73.19% real-world accuracy.", color: "#dcfce7", border: "#86efac", iconBg: "#16a34a" },
  { icon: "📵", title: "Works Offline",         desc: "ONNX-powered offline detection — works even without internet in remote farm areas.", color: "#dbeafe", border: "#93c5fd", iconBg: "#2563eb" },
  { icon: "🗺️", title: "Outbreak Map",          desc: "Real-time community disease outbreak map of India — know what's spreading in your state.", color: "#fef9c3", border: "#fde047", iconBg: "#ca8a04" },
  { icon: "🌦️", title: "Weather Risk",          desc: "Environmental risk analysis — checks if today's weather increases disease spread in your area.", color: "#fce7f3", border: "#f9a8d4", iconBg: "#db2777" },
  { icon: "🤖", title: "IoT Sensors",           desc: "Raspberry Pi integration — live temperature, humidity, soil moisture monitoring for your farm.", color: "#ede9fe", border: "#c4b5fd", iconBg: "#7c3aed" },
  { icon: "🔥", title: "AI Heatmap",            desc: "Grad-CAM visualization shows exactly which part of the leaf the AI detected the disease on.", color: "#ffedd5", border: "#fdba74", iconBg: "#ea580c" },
  { icon: "📅", title: "Crop Calendar",         desc: "Month-by-month seasonal disease risk calendar specific to Indian agricultural seasons.", color: "#ccfbf1", border: "#5eead4", iconBg: "#0d9488" },
  { icon: "📱", title: "WhatsApp Share",        desc: "Share diagnosis instantly on WhatsApp in Hindi or English — perfect for Indian farmers.", color: "#dcfce7", border: "#86efac", iconBg: "#15803d" },
  { icon: "🔊", title: "Voice Output",          desc: "Read diagnosis aloud in Hindi and English — accessible for farmers with low literacy.", color: "#fef3c7", border: "#fcd34d", iconBg: "#d97706" },
];

const CROPS = ["🍎 Apple","🫐 Blueberry","🍒 Cherry","🌽 Corn","🍇 Grape","🍊 Orange","🍑 Peach","🫑 Pepper","🥔 Potato","🍓 Strawberry","🍅 Tomato","🌿 Soybean","🎃 Squash","🍋 Raspberry"];

const COMPARISON = [
  { feature: "AI Disease Detection",    leafdoc: true,  plantix: true,  agrio: true  },
  { feature: "Offline Mode",            leafdoc: true,  plantix: false, agrio: false },
  { feature: "Voice Output (Hindi)",    leafdoc: true,  plantix: false, agrio: false },
  { feature: "Community Outbreak Map",  leafdoc: true,  plantix: false, agrio: false },
  { feature: "Grad-CAM Heatmap",        leafdoc: true,  plantix: false, agrio: false },
  { feature: "WhatsApp Share",          leafdoc: true,  plantix: false, agrio: false },
  { feature: "Seasonal Crop Calendar",  leafdoc: true,  plantix: false, agrio: false },
  { feature: "IoT Sensor Integration",  leafdoc: true,  plantix: false, agrio: true  },
  { feature: "Completely Free",         leafdoc: true,  plantix: true,  agrio: false },
  { feature: "Dosage Information",      leafdoc: true,  plantix: true,  agrio: true  },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const { lang }  = useLang();
  const { user }  = useAuth();

  return (
    <div style={L.page}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={L.hero}>
        <div style={L.heroInner}>
          <div style={L.heroContent}>
            <div style={L.heroBadge}>
              🏆 DTI Project — Bennett University 2026
            </div>
            <h1 style={L.heroH1}>
              Detect Plant Diseases<br />
              <span style={L.heroGradient}>Instantly with AI</span>
            </h1>
            <p style={L.heroDesc}>
              LeafDoc AI uses SWIN Transformer — the most advanced vision model —
              to diagnose 38 plant diseases across 14 crop types with 73.19% real-world accuracy.
              Built for Indian farmers. Free forever.
            </p>
            <div style={L.heroBtns}>
              <button style={L.heroBtnPrimary} onClick={() => navigate("/diagnose")}>
                🔬 {lang === "hi" ? "अभी निदान करें" : "Diagnose Your Plant"}
              </button>
              <button style={L.heroBtnSecondary} onClick={() => navigate("/map")}>
                🗺️ {lang === "hi" ? "प्रकोप मानचित्र" : "View Outbreak Map"}
              </button>
            </div>
            <div style={L.heroTrust}>
              <span style={L.heroTrustItem}>✅ Free forever</span>
              <span style={L.heroTrustItem}>✅ No ads</span>
              <span style={L.heroTrustItem}>✅ Works offline</span>
              <span style={L.heroTrustItem}>✅ Hindi + English</span>
            </div>
          </div>

          {/* Hero visual */}
          <div style={L.heroVisual}>
            <div style={L.heroCard}>
              <div style={L.heroCardHeader}>
                <div style={L.heroCardDot} />
                <span style={L.heroCardTitle}>Live Diagnosis</span>
                <span style={L.heroCardBadge}>AI</span>
              </div>
              <div style={L.heroCardDisease}>🍅 Tomato — Late Blight</div>
              <div style={L.heroCardConf}>
                <span>Confidence</span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>94.2%</span>
              </div>
              <div style={L.heroCardBar}>
                <div style={{ ...L.heroCardBarFill, width: "94%" }} />
              </div>
              <div style={L.heroCardSev}>🚨 High Risk</div>
              <div style={L.heroCardTreat}>
                💊 Apply Ridomil Gold MZ — 2.5g/L water, spray every 5-7 days
              </div>
              <div style={L.heroCardFeatures}>
                {["🔊 Voice", "📄 PDF", "📱 WhatsApp", "📅 Calendar"].map(f => (
                  <span key={f} style={L.heroCardFeature}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={L.stats}>
        <div style={L.statsInner}>
          {STATS.map(s => (
            <div key={s.label} style={L.statCard}>
              <div style={L.statIcon}>{s.icon}</div>
              <div style={L.statVal}>{s.value}</div>
              <div style={L.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODEL ACCURACY ───────────────────────────────────────────────── */}
      <section style={L.section}>
        <div style={L.sectionInner}>
          <div style={L.sectionBadge}>🤖 AI Research</div>
          <h2 style={L.sectionH2}>Our Model Evolution Journey</h2>
          <p style={L.sectionDesc}>
            We systematically improved real-world accuracy from 35.74% to 73.19% through research and experimentation.
          </p>
          <div style={L.evolutionGrid}>
            {[
              { v: "v1", name: "EfficientNet-B3", acc: 35.74, desc: "Original model — severe overfitting", color: "#ef4444", bg: "#fef2f2" },
              { v: "v2", name: "EfficientNet-B3", acc: 60.85, desc: "Retrained with real field data + augmentation", color: "#f97316", bg: "#fff7ed" },
              { v: "v3", name: "SWIN Transformer", acc: 73.19, desc: "Vision Transformer — best real-world performance", color: "#16a34a", bg: "#f0fdf4", best: true },
            ].map(m => (
              <div key={m.v} style={{ ...L.evolutionCard, background: m.bg, border: `2px solid ${m.best ? m.color : "#e5e7eb"}` }}>
                {m.best && <div style={L.evolutionBest}>🏆 Current Model</div>}
                <div style={L.evolutionVersion}>{m.v}</div>
                <div style={L.evolutionName}>{m.name}</div>
                <div style={{ ...L.evolutionAcc, color: m.color }}>{m.acc}%</div>
                <div style={L.evolutionLabel}>Real-World Accuracy</div>
                <div style={L.evolutionBar}>
                  <div style={{ ...L.evolutionBarFill, width: `${m.acc}%`, background: m.color }} />
                </div>
                <div style={L.evolutionDesc}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={L.plantixComparison}>
            <div style={L.plantixLeft}>
              <div style={L.plantixTitle}>vs Plantix (Industry Leader)</div>
              <div style={L.plantixSub}>They have 120 million images. We have 8,237.</div>
            </div>
            <div style={L.plantixRight}>
              <div style={L.plantixStat}>
                <span style={L.plantixVal}>14,563x</span>
                <span style={L.plantixStatLabel}>less training data</span>
              </div>
              <div style={L.plantixStat}>
                <span style={L.plantixVal}>73.19%</span>
                <span style={L.plantixStatLabel}>vs their ~90%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ ...L.section, background: "#f8fffe" }}>
        <div style={L.sectionInner}>
          <div style={L.sectionBadge}>✨ Features</div>
          <h2 style={L.sectionH2}>Everything a Farmer Needs</h2>
          <p style={L.sectionDesc}>
            9 powerful features — 7 of which no competitor offers.
          </p>
          <div style={L.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ ...L.featureCard, background: f.color, border: `1px solid ${f.border}` }}>
                <div style={{ ...L.featureIcon, background: f.iconBg }}>{f.icon}</div>
                <div style={L.featureTitle}>{f.title}</div>
                <div style={L.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section style={L.section}>
        <div style={L.sectionInner}>
          <div style={L.sectionBadge}>🏆 Comparison</div>
          <h2 style={L.sectionH2}>LeafDoc AI vs Competition</h2>
          <div style={L.tableWrap}>
            <table style={L.table}>
              <thead>
                <tr>
                  <th style={L.th}>Feature</th>
                  <th style={{ ...L.th, color: "#16a34a", background: "#f0fdf4" }}>LeafDoc AI</th>
                  <th style={L.th}>Plantix</th>
                  <th style={L.th}>Agrio</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={L.td}>{row.feature}</td>
                    <td style={{ ...L.td, textAlign: "center", background: "#f0fdf4" }}>
                      {row.leafdoc ? "✅" : "❌"}
                    </td>
                    <td style={{ ...L.td, textAlign: "center" }}>{row.plantix ? "✅" : "❌"}</td>
                    <td style={{ ...L.td, textAlign: "center" }}>{row.agrio  ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CROPS ────────────────────────────────────────────────────────── */}
      <section style={{ ...L.section, background: "#f0fdf4" }}>
        <div style={L.sectionInner}>
          <div style={L.sectionBadge}>🌾 Coverage</div>
          <h2 style={L.sectionH2}>14 Supported Crops</h2>
          <div style={L.cropsGrid}>
            {CROPS.map(c => (
              <div key={c} style={L.cropChip}>{c}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={L.cta}>
        <div style={L.ctaInner}>
          <h2 style={L.ctaH2}>Ready to protect your crops?</h2>
          <p style={L.ctaDesc}>
            Upload a photo of any diseased leaf and get an instant AI diagnosis in under 2 seconds.
          </p>
          <button style={L.ctaBtn} onClick={() => navigate("/diagnose")}>
            🔬 Start Free Diagnosis
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={L.footer}>
        <div style={L.footerInner}>
          <div style={L.footerLogo}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={L.footerLogoText}>LeafDoc AI</span>
          </div>
          <div style={L.footerText}>
            DTI Project · AI-Based Plant Disease Detection · EfficientNet-B3 + SWIN Transformer · Bennett University · 2026
          </div>
          <div style={L.footerLinks}>
            {["Home", "Diagnose", "Outbreak Map", "IoT Sensors", "History"].map(l => (
              <span key={l} style={L.footerLink}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

const L = {
  page: { fontFamily: "'DM Sans',sans-serif" },
  // Hero
  hero: { background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)", padding: "80px 24px 64px", borderBottom: "1px solid #bbf7d0" },
  heroInner: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" },
  heroContent: { display: "flex", flexDirection: "column", gap: 20 },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #bbf7d0", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, width: "fit-content" },
  heroH1: { fontFamily: "'Fraunces',serif", fontSize: "clamp(36px,4vw,52px)", fontWeight: 800, lineHeight: 1.1, color: "#111827" },
  heroGradient: { color: "#16a34a" },
  heroDesc: { fontSize: 16, color: "#4b5563", lineHeight: 1.7, maxWidth: 500 },
  heroBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
  heroBtnPrimary: { padding: "14px 28px", background: "#16a34a", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 16px rgba(22,163,74,0.3)" },
  heroBtnSecondary: { padding: "14px 28px", background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, color: "#16a34a", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  heroTrust: { display: "flex", gap: 16, flexWrap: "wrap" },
  heroTrustItem: { fontSize: 13, color: "#6b7280" },
  // Hero card
  heroVisual: { display: "flex", justifyContent: "center" },
  heroCard: { background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", width: "100%", maxWidth: 360, border: "1px solid #e5e7eb" },
  heroCardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  heroCardDot: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" },
  heroCardTitle: { fontSize: 12, color: "#6b7280", fontWeight: 600, flex: 1 },
  heroCardBadge: { background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, border: "1px solid #bbf7d0" },
  heroCardDisease: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12, fontFamily: "'Fraunces',serif" },
  heroCardConf: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 },
  heroCardBar: { height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  heroCardBarFill: { height: "100%", background: "linear-gradient(90deg,#16a34a,#22c55e)", borderRadius: 3 },
  heroCardSev: { display: "inline-block", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, marginBottom: 10 },
  heroCardTreat: { fontSize: 11, color: "#4b5563", background: "#f9fafb", borderRadius: 8, padding: "8px 10px", lineHeight: 1.5, marginBottom: 10 },
  heroCardFeatures: { display: "flex", gap: 6, flexWrap: "wrap" },
  heroCardFeature: { background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid #bbf7d0" },
  // Stats
  stats: { background: "#fff", borderBottom: "1px solid #f3f4f6" },
  statsInner: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 },
  statCard: { textAlign: "center", padding: "20px" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statVal: { fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 800, color: "#16a34a", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#6b7280", fontWeight: 500 },
  // Section
  section: { padding: "72px 24px", background: "#fff" },
  sectionInner: { maxWidth: 1200, margin: "0 auto" },
  sectionBadge: { display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 16 },
  sectionH2: { fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 800, color: "#111827", marginBottom: 16 },
  sectionDesc: { fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 40, maxWidth: 600 },
  // Evolution
  evolutionGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 24 },
  evolutionCard: { borderRadius: 16, padding: 24, position: "relative" },
  evolutionBest: { position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" },
  evolutionVersion: { display: "inline-block", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 8 },
  evolutionName: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 },
  evolutionAcc: { fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 800, lineHeight: 1 },
  evolutionLabel: { fontSize: 12, color: "#6b7280", marginBottom: 10 },
  evolutionBar: { height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  evolutionBarFill: { height: "100%", borderRadius: 3 },
  evolutionDesc: { fontSize: 13, color: "#4b5563", lineHeight: 1.5 },
  plantixComparison: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  plantixLeft: {},
  plantixTitle: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 },
  plantixSub: { fontSize: 13, color: "#6b7280" },
  plantixRight: { display: "flex", gap: 32 },
  plantixStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  plantixVal: { fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 800, color: "#16a34a" },
  plantixStatLabel: { fontSize: 11, color: "#6b7280", textAlign: "center" },
  // Features
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 },
  featureCard: { borderRadius: 16, padding: 20 },
  featureIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", marginBottom: 12 },
  featureTitle: { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 },
  featureDesc: { fontSize: 13, color: "#4b5563", lineHeight: 1.6 },
  // Comparison table
  tableWrap: { overflowX: "auto", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { padding: "14px 20px", textAlign: "left", background: "#f9fafb", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "12px 20px", borderBottom: "1px solid #f3f4f6", color: "#374151" },
  // Crops
  cropsGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 },
  cropChip: { background: "#fff", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 8px", fontSize: 13, color: "#374151", textAlign: "center", fontWeight: 500 },
  // CTA
  cta: { background: "linear-gradient(135deg,#166534,#15803d)", padding: "72px 24px", textAlign: "center" },
  ctaInner: { maxWidth: 600, margin: "0 auto" },
  ctaH2: { fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 800, color: "#fff", marginBottom: 16 },
  ctaDesc: { fontSize: 16, color: "#bbf7d0", lineHeight: 1.7, marginBottom: 32 },
  ctaBtn: { padding: "16px 36px", background: "#fff", border: "none", borderRadius: 14, color: "#16a34a", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  // Footer
  footer: { background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "32px 24px" },
  footerInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
  footerLogo: { display: "flex", alignItems: "center", gap: 8 },
  footerLogoText: { fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "#111827" },
  footerText: { fontSize: 12, color: "#9ca3af", textAlign: "center", flex: 1 },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { fontSize: 13, color: "#6b7280", cursor: "pointer" },
};