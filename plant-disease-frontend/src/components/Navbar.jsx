// components/Navbar.jsx — Modern top navigation bar
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang, LangToggle } from "../LanguageContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { lang } = useLang();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { path: "/",           label: lang === "hi" ? "होम"        : "Home",        icon: "🏠" },
    { path: "/diagnose",   label: lang === "hi" ? "निदान"       : "Diagnose",    icon: "🔬" },
    { path: "/map",        label: lang === "hi" ? "मानचित्र"    : "Outbreak Map", icon: "🗺️" },
    { path: "/iot",        label: lang === "hi" ? "IoT सेंसर"   : "IoT Sensors", icon: "🤖" },
    { path: "/history",    label: lang === "hi" ? "इतिहास"      : "History",     icon: "🕐" },
    { path: "/progression",label: lang === "hi" ? "प्रगति"      : "Progression", icon: "📊" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={N.nav}>
      <div style={N.inner}>
        {/* Logo */}
        <div style={N.logo} onClick={() => navigate("/")} className="clickable">
          <div style={N.logoMark}>🌿</div>
          <div>
            <div style={N.logoName}>LeafDoc<span style={N.logoAI}> AI</span></div>
            <div style={N.logoTagline}>Plant Disease Detection</div>
          </div>
        </div>

        {/* Desktop links */}
        <div style={N.links}>
          {links.map(link => (
            <button
              key={link.path}
              style={{
                ...N.link,
                ...(isActive(link.path) ? N.linkActive : {}),
              }}
              onClick={() => navigate(link.path)}>
              <span style={{ fontSize: 14 }}>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={N.right}>
          {/* Model badge */}
          <div style={N.modelBadge}>
            <div style={N.modelDot} />
            <span>SWIN · 73.19%</span>
          </div>

          <LangToggle />

          {/* User */}
          {user && (
            <div style={N.userMenu}>
              <img
                src={user.photoURL || ""}
                alt={user.displayName}
                style={N.avatar}
                referrerPolicy="no-referrer"
              />
              <span style={N.userName}>{user.displayName?.split(" ")[0]}</span>
              <button style={N.signOut} onClick={signOut} title="Sign out">↗</button>
            </div>
          )}

          {/* Mobile menu button */}
          <button style={N.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={N.mobileMenu}>
          {links.map(link => (
            <button
              key={link.path}
              style={{
                ...N.mobileLink,
                ...(isActive(link.path) ? N.mobileLinkActive : {}),
              }}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}>
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .clickable { cursor: pointer; }
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

const N = {
  nav: { position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 8 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginRight: 8, flexShrink: 0 },
  logoMark: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#16a34a,#22c55e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  logoName: { fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1 },
  logoAI: { color: "#16a34a" },
  logoTagline: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" },
  links: { display: "flex", alignItems: "center", gap: 2, flex: 1 },
  link: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s ease", whiteSpace: "nowrap" },
  linkActive: { background: "#f0fdf4", color: "#16a34a", fontWeight: 600 },
  right: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 },
  modelBadge: { display: "flex", alignItems: "center", gap: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#16a34a", fontWeight: 600, whiteSpace: "nowrap" },
  modelDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" },
  userMenu: { display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 20, padding: "3px 10px 3px 3px" },
  avatar: { width: 26, height: 26, borderRadius: "50%", objectFit: "cover" },
  userName: { fontSize: 13, color: "#374151", fontWeight: 500, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  signOut: { background: "transparent", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", padding: "0 2px" },
  menuBtn: { display: "none", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 8, background: "transparent", fontSize: 16, cursor: "pointer", color: "#374151" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 4 },
  mobileLink: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif" },
  mobileLinkActive: { background: "#f0fdf4", color: "#16a34a", fontWeight: 600 },
};