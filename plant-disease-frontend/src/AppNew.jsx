// AppNew.jsx — LeafDoc AI Redesigned with React Router
// Modern white + green theme like Plantix/Agrio
// DTI Project | Bennett University 2026

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import DiagnosePage from "./pages/DiagnosePage";
import ResultPage from "./pages/ResultPage";
import MapPage from "./pages/MapPage";
import IoTPage from "./pages/IoTPage";
import HistoryPage from "./pages/HistoryPage";
import ProgressionPage from "./pages/ProgressionPage";
import LoginPage from "./LoginPage";
import { useState } from "react";

function AppInner() {
  const { user, loading } = useAuth();
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [diagnosisPreview, setDiagnosisPreview] = useState(null);
  const [diagnosisFile, setDiagnosisFile] = useState(null);

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#f0fdf4"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid #bbf7d0", borderTopColor: "#16a34a",
          animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
        }} />
        <div style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}>Loading LeafDoc AI...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#f8fffe", fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/diagnose" element={
            <DiagnosePage
              onResult={(result, preview, file) => {
                setDiagnosisResult(result);
                setDiagnosisPreview(preview);
                setDiagnosisFile(file);

                // ── Save to localStorage history ──────────────────────────────────
                try {
                  const entry = {
                    id:         Date.now(),
                    timestamp:  new Date().toISOString(),
                    preview:    preview,
                    disease:    result.diagnosis.top_prediction.display_name,
                    confidence: result.diagnosis.top_prediction.confidence,
                    isHealthy:  result.diagnosis.is_healthy,
                    severity:   result.disease_info.severity,
                  };
                  const existing = JSON.parse(
                    localStorage.getItem("leafdoc_history") || "[]"
                  );
                  const updated = [entry, ...existing].slice(0, 20);
                  localStorage.setItem("leafdoc_history", JSON.stringify(updated));
                } catch (e) {
                  console.error("History save failed:", e);
                }
              }}
            />
          } />
          <Route path="/result" element={
            diagnosisResult
              ? <ResultPage result={diagnosisResult} preview={diagnosisPreview} file={diagnosisFile} />
              : <Navigate to="/diagnose" />
          } />
          <Route path="/map" element={<MapPage />} />
          <Route path="/iot" element={<IoTPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fffe; overflow-x: hidden; }
        :root {
          --green-50: #f0fdf4;
          --green-100: #dcfce7;
          --green-200: #bbf7d0;
          --green-500: #22c55e;
          --green-600: #16a34a;
          --green-700: #15803d;
          --green-800: #166534;
          --white: #ffffff;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-500: #6b7280;
          --gray-700: #374151;
          --gray-900: #111827;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 20px;
          --radius-xl: 28px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.92)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>
    </BrowserRouter>
  );
}

export default function AppNew() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}