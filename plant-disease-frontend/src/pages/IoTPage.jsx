// pages/IoTPage.jsx
import IoTSimulator from "../IoTSimulator";
import { useLang } from "../LanguageContext";
export default function IoTPage() {
  const { lang } = useLang();
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 12 }}>
          🤖 Innovation #4
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,36px)", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          IoT Sensor Monitoring
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, maxWidth: 600 }}>
          Simulate real-time environmental monitoring with Raspberry Pi sensors.
          Temperature, humidity, soil moisture, light and CO₂ data feeds directly into disease risk analysis.
        </p>
      </div>
      <IoTSimulator lang={lang} />
    </div>
  );
}