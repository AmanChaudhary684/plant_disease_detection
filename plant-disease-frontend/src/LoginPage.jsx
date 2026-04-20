import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. If it keeps happening, enable popups (or try again—this app can fall back to redirect sign-in).");
        return;
      }
      if (code === "auth/unauthorized-domain") {
        setError(
          "Sign-in blocked: this domain is not authorized in Firebase. Add your dev URL (e.g. localhost) to Firebase Console → Authentication → Settings → Authorized domains."
        );
        return;
      }
      if (code === "auth/popup-blocked") {
        setError("Popup blocked by browser. Allow popups for this site and try again.");
        return;
      }
      setError(
        `Sign-in failed${code ? ` (${code})` : ""}. ${err?.message ? err.message : "Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={L.root}>
      {/* Animated background */}
      <div style={L.bgGlow1} />
      <div style={L.bgGlow2} />
      <div style={L.noise} />
      <div style={L.particles}>
        {"🌿🍃🌱🍀🌾🌻🪴🌳".split("").map((e, i) => (
          <span
            key={i}
            style={{
              ...L.particle,
              animationDelay: `${i * 1.5}s`,
              left: `${5 + i * 12}%`,
              fontSize: 16 + Math.random() * 12,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      <div style={L.card}>
        {/* Logo */}
        <div style={L.logoRow}>
          <div style={L.logoMark}>
            <span>🌿</span>
          </div>
          <div>
            <div style={L.logoName}>
              LeafDoc<span style={L.logoAI}> AI</span>
            </div>
            <div style={L.logoTagline}>AI-POWERED PLANT DIAGNOSIS</div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={L.h1}>
          Welcome to{" "}
          <span style={L.h1Accent}>LeafDoc</span>
        </h1>
        <p style={L.subtitle}>
          Detect plant diseases instantly using AI. Sign in to get started with your personal diagnosis dashboard.
        </p>

        {/* Feature pills */}
        <div style={L.features}>
          {[
            { icon: "🔬", text: "AI Diagnosis" },
            { icon: "🌾", text: "38 Disease Classes" },
            { icon: "🎯", text: "99%+ Accuracy" },
            { icon: "📊", text: "Track Progress" },
          ].map((f) => (
            <div key={f.text} style={L.featurePill}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={L.divider}>
          <div style={L.dividerLine} />
          <span style={L.dividerText}>Sign in to continue</span>
          <div style={L.dividerLine} />
        </div>

        {/* Google Sign-In Button */}
        <button
          style={{
            ...L.googleBtn,
            ...(loading ? L.googleBtnLoading : {}),
          }}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={L.spinner} />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <svg style={L.googleIcon} viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {error && <div style={L.error}>⚠️ {error}</div>}

        {/* Privacy note */}
        <p style={L.privacy}>
          🔒 Your data stays private. We only use your name and photo for personalization.
        </p>
      </div>

      {/* Footer */}
      <div style={L.footer}>
        DTI Project · AI-Based Plant Disease Detection · Bennett University · 2026
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050e07; overflow-x: hidden; }
        @keyframes floatUp { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 10%{opacity:0.4} 90%{opacity:0.15} 100%{transform:translateY(-10vh) rotate(360deg);opacity:0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes cardAppear { from{opacity:0;transform:translateY(30px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes glowPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.1)} }
      `}</style>
    </div>
  );
}

const L = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #050e07 0%, #071a0b 40%, #050e07 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    color: "#e2f5e6",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },
  bgGlow1: {
    position: "absolute",
    top: "10%",
    left: "20%",
    width: 500,
    height: 500,
    background: "radial-gradient(circle, rgba(22,163,74,0.15), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(80px)",
    animation: "glowPulse 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    bottom: "15%",
    right: "15%",
    width: 400,
    height: 400,
    background: "radial-gradient(circle, rgba(74,222,128,0.1), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    animation: "glowPulse 8s ease-in-out infinite 2s",
    pointerEvents: "none",
  },
  noise: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    opacity: 0.4,
  },
  particles: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    bottom: "-10%",
    opacity: 0,
    animation: "floatUp 14s ease-in-out infinite",
  },
  card: {
    position: "relative",
    zIndex: 1,
    maxWidth: 480,
    width: "100%",
    background: "rgba(10, 30, 15, 0.8)",
    border: "1px solid rgba(74, 222, 128, 0.18)",
    borderRadius: 28,
    padding: "44px 36px",
    backdropFilter: "blur(24px)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(22,163,74,0.08), inset 0 1px 0 rgba(74,222,128,0.1)",
    animation: "cardAppear 0.6s ease forwards",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
    justifyContent: "center",
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "linear-gradient(135deg, #166534, #15803d)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    boxShadow: "0 0 24px rgba(22,163,74,0.45)",
  },
  logoName: {
    fontFamily: "'Clash Display', sans-serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#f0fdf4",
    letterSpacing: "-0.5px",
  },
  logoAI: { color: "#4ade80" },
  logoTagline: {
    fontSize: 10,
    color: "#6ee7b7",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  h1: {
    fontFamily: "'Clash Display', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    textAlign: "center",
    color: "#f0fdf4",
    marginBottom: 12,
    lineHeight: 1.2,
  },
  h1Accent: {
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #86efac 100%)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "shimmer 4s linear infinite",
  },
  subtitle: {
    fontSize: 15,
    color: "#a7f3d0",
    textAlign: "center",
    lineHeight: 1.7,
    marginBottom: 28,
    fontWeight: 400,
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 28,
  },
  featurePill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(22, 163, 74, 0.08)",
    border: "1px solid rgba(74, 222, 128, 0.15)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    color: "#86efac",
    fontWeight: 500,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(74, 222, 128, 0.15)",
  },
  dividerText: {
    fontSize: 12,
    color: "#4b7a57",
    fontWeight: 500,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
  googleBtn: {
    width: "100%",
    padding: "15px 24px",
    borderRadius: 14,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#f0fdf4",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    transition: "all 0.25s ease",
    backdropFilter: "blur(8px)",
    marginBottom: 16,
  },
  googleBtnLoading: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  googleIcon: {
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#4ade80",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  error: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#fca5a5",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  privacy: {
    fontSize: 12,
    color: "#4b7a57",
    textAlign: "center",
    lineHeight: 1.6,
  },
  footer: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    marginTop: 32,
    fontSize: 11,
    color: "rgba(110, 231, 183, 0.25)",
    letterSpacing: "0.04em",
  },
};
