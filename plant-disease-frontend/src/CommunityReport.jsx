import { useState, useEffect, useCallback } from "react";
const API_BASE = "http://localhost:8000";
const INDIA_STATES = ["Uttar Pradesh","Maharashtra","Bihar","West Bengal","Madhya Pradesh","Tamil Nadu","Rajasthan","Karnataka","Gujarat","Andhra Pradesh","Odisha","Telangana","Kerala","Jharkhand","Assam","Punjab","Haryana","Chhattisgarh","Uttarakhand","Himachal Pradesh","Delhi","Jammu & Kashmir"];

export function useCommunityReport() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const submitReport = useCallback(async (disease, state, city = null) => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/community/report`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ disease, state, city }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); return { success: true }; }
      throw new Error(data.reason || "Failed");
    } catch(e) { setError(e.message); return { success: false }; }
    finally { setSubmitting(false); }
  }, []);
  return { submitReport, submitting, submitted, error };
}

export function CommunityReportButton({ result, lang }) {
  const [open, setOpen] = useState(false);
  if (!result || result.diagnosis?.is_healthy) return null;
  const disease = result.diagnosis?.top_prediction?.class_id || "";
  return (
    <>
      <button onClick={() => setOpen(true)} style={{width:"100%",marginTop:8,padding:"12px 16px",background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:12,color:"#fb923c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Cabinet Grotesk',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        📍 {lang === "hi" ? "समुदाय को रिपोर्ट करें" : "Report to Community"}
      </button>
      {open && <CommunityReportModal disease={disease} lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}

function CommunityReportModal({ disease, lang, onClose }) {
  const { submitReport, submitting, submitted, error } = useCommunityReport();
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const displayDisease = disease.replace(/___/g, " - ").replace(/_/g, " ");
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        const raw = d.address?.state || "";
        const matched = INDIA_STATES.find(s => raw.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(raw.toLowerCase()));
        if (matched) setState(matched);
        if (d.address?.city || d.address?.town) setCity(d.address.city || d.address.town || "");
      } catch {}
    });
  };
  const OV = {position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16};
  const MOD = {background:"linear-gradient(160deg,#071a0b,#050e07)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:20,width:"100%",maxWidth:440,overflow:"hidden",boxShadow:"0 25px 60px rgba(0,0,0,0.6)"};
  return (
    <div style={OV} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={MOD}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"20px 20px 16px",borderBottom:"1px solid rgba(251,146,60,0.15)"}}>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#f0fdf4",marginBottom:4}}>📍 {lang==="hi"?"रोग की रिपोर्ट करें":"Report Disease Outbreak"}</div>
            <div style={{fontSize:12,color:"#6ee7b7"}}>{lang==="hi"?"किसानों को सतर्क करने के लिए रिपोर्ट करें":"Help farmers by reporting this disease in your area"}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        {!submitted ? (
          <div style={{padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:16}}>
              <span style={{fontSize:16}}>🔬</span>
              <div>
                <div style={{fontSize:11,color:"#6ee7b7",marginBottom:2}}>{lang==="hi"?"पाया गया रोग":"Detected Disease"}</div>
                <div style={{fontSize:14,fontWeight:600,color:"#f0fdf4"}}>{displayDisease}</div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,color:"#86efac",fontWeight:600,marginBottom:6}}>🗺️ {lang==="hi"?"राज्य चुनें *":"Select Your State *"}</label>
              <div style={{display:"flex",gap:8}}>
                <select value={state} onChange={e=>setState(e.target.value)} style={{flex:1,background:"rgba(0,0,0,0.4)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:10,padding:"10px 12px",color:"#f0fdf4",fontSize:14,fontFamily:"'Cabinet Grotesk',sans-serif",outline:"none"}}>
                  <option value="">{lang==="hi"?"राज्य चुनें...":"Choose state..."}</option>
                  {INDIA_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={detectLocation} title="Auto-detect location" style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:10,padding:"0 14px",fontSize:18,cursor:"pointer"}}>📍</button>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,color:"#86efac",fontWeight:600,marginBottom:6}}>🏙️ {lang==="hi"?"शहर (वैकल्पिक)":"City (optional)"}</label>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder={lang==="hi"?"जैसे दिल्ली, पुणे...":"e.g. Delhi, Pune..."} style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:10,padding:"10px 12px",color:"#f0fdf4",fontSize:14,fontFamily:"'Cabinet Grotesk',sans-serif",outline:"none"}} />
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-start",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:10,padding:"10px 12px",marginBottom:16}}>
              <span>ℹ️</span>
              <span style={{fontSize:12,color:"#a7f3d0",lineHeight:1.5}}>{lang==="hi"?"आपकी रिपोर्ट भारत के रोग प्रकोप मानचित्र पर दिखेगी।":"Your report will appear on the India disease outbreak map and alert nearby farmers."}</span>
            </div>
            {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 12px",color:"#f87171",fontSize:13,marginBottom:12}}>⚠️ {error}</div>}
            <button onClick={()=>submitReport(disease,state,city||null)} disabled={!state||submitting} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#f97316,#ea580c)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:!state||submitting?"not-allowed":"pointer",opacity:!state||submitting?0.5:1,fontFamily:"'Cabinet Grotesk',sans-serif"}}>
              {submitting?"Submitting...":(lang==="hi"?"✅ रिपोर्ट सबमिट करें":"✅ Submit Report")}
            </button>
          </div>
        ) : (
          <div style={{padding:"32px 20px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div style={{fontSize:20,fontWeight:700,color:"#4ade80",marginBottom:8}}>{lang==="hi"?"रिपोर्ट सबमिट हो गई!":"Report Submitted!"}</div>
            <div style={{fontSize:14,color:"#d1fae5",marginBottom:8,lineHeight:1.6}}>{lang==="hi"?`${state} के किसानों को सतर्क किया गया है।`:`Farmers in ${state} have been alerted about ${displayDisease}.`}</div>
            <div style={{fontSize:12,color:"#6ee7b7",marginBottom:20}}>{lang==="hi"?"यह रोग प्रकोप मानचित्र पर दिख रहा है।":"Now visible on the outbreak map."}</div>
            <button onClick={onClose} style={{padding:"12px 32px",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Cabinet Grotesk',sans-serif"}}>{lang==="hi"?"ठीक है":"Done"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveFeedTicker({ lang }) {
  const [reports, setReports] = useState([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    fetch(`${API_BASE}/api/community/recent?limit=15`).then(r=>r.json()).then(d=>{if(d.success)setReports(d.data);}).catch(()=>{});
  }, []);
  useEffect(() => {
    if (!reports.length) return;
    const t = setInterval(()=>setIdx(i=>(i+1)%reports.length), 3500);
    return ()=>clearInterval(t);
  }, [reports]);
  if (!reports.length) return null;
  const r = reports[idx];
  const timeStr = new Date(r.timestamp).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:10,padding:"8px 14px",marginBottom:16}}>
      <div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#f87171",whiteSpace:"nowrap"}}>🔴 {lang==="hi"?"लाइव":"LIVE"}</div>
      <div style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        <span style={{color:"#fb923c",fontWeight:600}}>{r.disease}</span>
        <span style={{color:"#9ca3af"}}> — </span>
        <span style={{color:"#d1fae5"}}>{r.state}</span>
        <span style={{color:"#6b7280",fontSize:11,marginLeft:6}}>{timeStr}</span>
      </div>
      <div style={{display:"flex",gap:4}}>
        {reports.slice(0,5).map((_,i)=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===idx%5?"#fb923c":"rgba(255,255,255,0.2)",transition:"background 0.3s"}} />
        ))}
      </div>
    </div>
  );
}

export function CommunityStatsBar({ lang }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/community/stats`).then(r=>r.json()).then(d=>{if(d.success)setStats(d.data);}).catch(()=>{});
  }, []);
  if (!stats) return null;
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
      {[
        {icon:"📊",val:stats.total_reports.toLocaleString(),label:lang==="hi"?"कुल रिपोर्ट":"Total Reports"},
        {icon:"👥",val:stats.user_reports.toLocaleString(),label:lang==="hi"?"समुदाय रिपोर्ट":"Community Reports"},
        {icon:"🗺️",val:stats.states_affected,label:lang==="hi"?"प्रभावित राज्य":"States Affected"},
      ].map(s=>(
        <div key={s.label} style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:120}}>
          <span style={{fontSize:18}}>{s.icon}</span>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#4ade80"}}>{s.val}</div>
            <div style={{fontSize:11,color:"#6b7280"}}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CommunityReportModal;