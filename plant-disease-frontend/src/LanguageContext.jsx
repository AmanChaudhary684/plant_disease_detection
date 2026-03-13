/**
 * LanguageContext.jsx — LeafDoc AI
 * Hindi/English language toggle with React Context.
 * Place in: src/LanguageContext.jsx
 */

import { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("leafdoc_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("leafdoc_lang", lang);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [lang]);

  const toggleLang = () => setLang(l => l === "en" ? "hi" : "en");
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// ── Language Toggle Button ─────────────────────────────────────────────────
export function LangToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button onClick={toggleLang} style={LT.btn} title="Switch language / भाषा बदलें">
      <span style={LT.flag}>{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span style={LT.text}>{lang === "en" ? "हिंदी" : "English"}</span>
    </button>
  );
}

const LT = {
  btn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "7px 14px",
    fontSize: 13, color: "#a7f3d0", cursor: "pointer",
    fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 600,
    transition: "all 0.2s",
  },
  flag: { fontSize: 16 },
  text: { fontSize: 13 },
};