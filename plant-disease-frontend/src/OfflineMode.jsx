/**
 * OfflineMode.jsx — LeafDoc AI
 * DTI Project | Innovation #1: Offline-First Architecture
 *
 * Drop this component into App.jsx to add full offline detection support.
 * Shows connectivity status, model download progress, and offline results.
 *
 * Place in: src/OfflineMode.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadOfflineModel,
  runOfflineInference,
  getOfflineModelStatus,
  isOnline,
  onConnectivityChange,
  registerServiceWorker,
} from './offlineInference';

// ── Connectivity Banner ────────────────────────────────────────────────────
export function ConnectivityBanner({ onOfflineModeClick }) {
  const [online, setOnline]         = useState(isOnline());
  const [justWentOnline, setJustWentOnline] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    onConnectivityChange((nowOnline) => {
      setOnline(nowOnline);
      if (nowOnline) {
        setJustWentOnline(true);
        setTimeout(() => setJustWentOnline(false), 4000);
      }
    });
  }, []);

  if (online && !justWentOnline) return null;

  if (justWentOnline) {
    return (
      <div style={OB.bannerOnline}>
        <span style={OB.bannerDot} />
        <span>Back online — switched to full accuracy mode</span>
      </div>
    );
  }

  return (
    <div style={OB.bannerOffline}>
      <div style={OB.bannerLeft}>
        <span style={OB.bannerIcon}>📵</span>
        <div>
          <div style={OB.bannerTitle}>You're offline</div>
          <div style={OB.bannerSub}>Using on-device AI model — diagnosis still works!</div>
        </div>
      </div>
      <button style={OB.bannerBtn} onClick={onOfflineModeClick}>
        Use Offline Mode →
      </button>
    </div>
  );
}

// ── Offline Detector Panel ─────────────────────────────────────────────────
export function OfflineDetector({ file, preview, onResult }) {
  const [status, setStatus]     = useState('idle'); // idle|downloading|ready|running|done|error
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError]       = useState('');
  const [modelReady, setModelReady] = useState(getOfflineModelStatus() === 'ready');

  // Auto-load model when component mounts
  useEffect(() => {
    if (getOfflineModelStatus() === 'ready') { setModelReady(true); return; }
    handleDownload();
  }, []);

  const handleDownload = async () => {
    setStatus('downloading'); setError('');
    try {
      await loadOfflineModel((pct, msg) => {
        setProgress(pct); setProgressMsg(msg);
      });
      setModelReady(true);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setError(`Could not load offline model: ${e.message}. Make sure plant_disease_offline.onnx is in public/models/`);
    }
  };

  const handleRun = useCallback(async () => {
    if (!file && !preview) { setError('No image selected.'); return; }
    setStatus('running'); setError('');
    try {
      const result = await runOfflineInference(preview || file);
      setStatus('done');
      onResult(result);
    } catch (e) {
      setStatus('error');
      setError(`Inference failed: ${e.message}`);
    }
  }, [file, preview, onResult]);

  return (
    <div style={OB.panel}>
      {/* Header */}
      <div style={OB.panelHeader}>
        <div style={OB.panelIcon}>📵</div>
        <div>
          <div style={OB.panelTitle}>Offline Mode</div>
          <div style={OB.panelSub}>On-device AI · No internet required</div>
        </div>
        <div style={OB.innovBadge}>Innovation #1</div>
      </div>

      {/* How it works */}
      <div style={OB.infoRow}>
        {[
          { icon: '🧠', text: 'Model runs in your browser' },
          { icon: '🔒', text: 'No data leaves device' },
          { icon: '⚡', text: '~2s inference time' },
          { icon: '🎯', text: '38 disease classes' },
        ].map(item => (
          <div key={item.text} style={OB.infoChip}>
            <span>{item.icon}</span>
            <span style={OB.infoChipText}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Status: downloading */}
      {status === 'downloading' && (
        <div style={OB.progressBox}>
          <div style={OB.progressHeader}>
            <span style={OB.progressMsg}>{progressMsg || 'Loading model...'}</span>
            <span style={OB.progressPct}>{progress}%</span>
          </div>
          <div style={OB.progressTrack}>
            <div style={{ ...OB.progressFill, width: `${progress}%` }} />
          </div>
          <div style={OB.progressNote}>
            First time only — model (~25MB) is cached in your browser after download.
            Next time, it loads instantly offline!
          </div>
        </div>
      )}

      {/* Status: ready */}
      {(status === 'ready' || modelReady) && status !== 'running' && status !== 'done' && (
        <div style={OB.readyBox}>
          <div style={OB.readyIcon}>✅</div>
          <div style={OB.readyText}>
            Offline model ready! {file ? 'Click below to analyze your leaf.' : 'Upload a leaf image to diagnose.'}
          </div>
        </div>
      )}

      {/* Status: running */}
      {status === 'running' && (
        <div style={OB.runningBox}>
          <span style={OB.runningSpinner} />
          <span style={OB.runningText}>Running on-device AI inference...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={OB.errorBox}>
          ⚠️ {error}
          <button style={OB.retryBtn} onClick={handleDownload}>Retry</button>
        </div>
      )}

      {/* Action button */}
      {status !== 'running' && status !== 'downloading' && (
        <button
          style={{ ...OB.runBtn, ...((!file && !preview) || status === 'done' ? OB.runBtnOff : {}) }}
          disabled={(!file && !preview) || status === 'done'}
          onClick={modelReady ? handleRun : handleDownload}
        >
          {!modelReady
            ? '⬇️ Download Model (~25MB)'
            : status === 'done'
              ? '✅ Analysis Complete'
              : '🔬 Diagnose Offline'}
        </button>
      )}

      {/* Accuracy note */}
      <div style={OB.accuracyNote}>
        <span style={OB.accuracyNoteIcon}>ℹ️</span>
        <span>
          Offline accuracy ~92–95% vs 99%+ online. For critical decisions, verify online when available.
        </span>
      </div>
    </div>
  );
}

// ── Offline Result Badge ───────────────────────────────────────────────────
export function OfflineBadge({ inferenceMs }) {
  return (
    <div style={OB.offlineBadge}>
      <span style={OB.offlineBadgeDot} />
      <span>📵 Offline Mode · On-device AI</span>
      {inferenceMs && <span style={OB.offlineBadgeMs}>· {inferenceMs}ms</span>}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const OB = {
  // Connectivity banner
  bannerOffline: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    background:'rgba(234,179,8,0.12)', border:'1px solid rgba(234,179,8,0.35)',
    borderRadius:14, padding:'14px 18px', marginBottom:20,
    flexWrap:'wrap', gap:10, animation:'fadeUp 0.3s ease',
  },
  bannerOnline: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)',
    borderRadius:14, padding:'12px 18px', marginBottom:20,
    color:'#4ade80', fontSize:14, fontWeight:600, animation:'fadeUp 0.3s ease',
  },
  bannerDot: {
    width:8, height:8, borderRadius:'50%', background:'#4ade80',
    display:'inline-block', animation:'pulse 2s ease-in-out infinite',
  },
  bannerLeft: { display:'flex', alignItems:'center', gap:12 },
  bannerIcon: { fontSize:22 },
  bannerTitle: { fontSize:14, fontWeight:700, color:'#fbbf24', marginBottom:2 },
  bannerSub: { fontSize:12, color:'#fde68a' },
  bannerBtn: {
    background:'rgba(234,179,8,0.2)', border:'1px solid rgba(234,179,8,0.4)',
    color:'#fbbf24', borderRadius:10, padding:'8px 18px', fontSize:13,
    fontWeight:700, cursor:'pointer', fontFamily:"'Cabinet Grotesk',sans-serif",
  },

  // Main panel
  panel: {
    background:'rgba(10,40,18,0.6)', border:'1px solid rgba(74,222,128,0.2)',
    borderRadius:20, padding:'22px', backdropFilter:'blur(16px)',
  },
  panelHeader: { display:'flex', alignItems:'center', gap:12, marginBottom:16 },
  panelIcon: {
    width:44, height:44, borderRadius:12,
    background:'linear-gradient(135deg,#166534,#15803d)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
    boxShadow:'0 0 16px rgba(22,163,74,0.4)', flexShrink:0,
  },
  panelTitle: { fontFamily:"'Clash Display',sans-serif", fontSize:18, fontWeight:700, color:'#f0fdf4' },
  panelSub: { fontSize:12, color:'#6ee7b7', marginTop:2 },
  innovBadge: {
    marginLeft:'auto', background:'rgba(74,222,128,0.15)',
    border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80',
    borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, flexShrink:0,
  },

  // Info chips
  infoRow: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 },
  infoChip: {
    display:'flex', alignItems:'center', gap:6,
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:20, padding:'5px 12px', fontSize:12,
  },
  infoChipText: { color:'#a7f3d0' },

  // Progress
  progressBox: {
    background:'rgba(0,0,0,0.3)', borderRadius:14, padding:'16px', marginBottom:14,
  },
  progressHeader: { display:'flex', justifyContent:'space-between', marginBottom:8 },
  progressMsg: { fontSize:13, color:'#6ee7b7' },
  progressPct: { fontSize:14, fontWeight:700, color:'#4ade80', fontFamily:"'Clash Display',sans-serif" },
  progressTrack: { height:8, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden', marginBottom:10 },
  progressFill: {
    height:'100%', borderRadius:4,
    background:'linear-gradient(90deg, rgba(74,222,128,0.5), #4ade80)',
    transition:'width 0.4s ease',
  },
  progressNote: { fontSize:11, color:'#4b7a57', lineHeight:1.6 },

  // Ready
  readyBox: {
    display:'flex', alignItems:'center', gap:12,
    background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
    borderRadius:12, padding:'12px 16px', marginBottom:14,
  },
  readyIcon: { fontSize:20 },
  readyText: { fontSize:13, color:'#86efac', lineHeight:1.5 },

  // Running
  runningBox: {
    display:'flex', alignItems:'center', gap:12,
    background:'rgba(74,222,128,0.08)', borderRadius:12, padding:'14px 16px', marginBottom:14,
  },
  runningSpinner: {
    width:20, height:20, borderRadius:'50%',
    border:'2px solid rgba(74,222,128,0.3)', borderTopColor:'#4ade80',
    animation:'spin 0.8s linear infinite', display:'inline-block', flexShrink:0,
  },
  runningText: { fontSize:13, color:'#86efac', fontWeight:500 },

  // Error
  errorBox: {
    background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
    borderRadius:12, padding:'12px 14px', color:'#fca5a5', fontSize:13,
    marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10,
    lineHeight:1.6,
  },
  retryBtn: {
    background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.3)',
    color:'#f87171', borderRadius:8, padding:'4px 12px', fontSize:12,
    cursor:'pointer', fontFamily:"'Cabinet Grotesk',sans-serif", flexShrink:0,
  },

  // Run button
  runBtn: {
    width:'100%', padding:'16px',
    background:'linear-gradient(135deg,#16a34a,#15803d)',
    border:'none', borderRadius:14, color:'#fff',
    fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700,
    cursor:'pointer', marginBottom:12,
    boxShadow:'0 4px 20px rgba(22,163,74,0.3)',
  },
  runBtnOff: { opacity:0.4, cursor:'not-allowed', boxShadow:'none' },

  // Accuracy note
  accuracyNote: {
    display:'flex', gap:8, alignItems:'flex-start',
    background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)',
    borderRadius:10, padding:'10px 12px', fontSize:11, color:'#fde68a', lineHeight:1.6,
  },
  accuracyNoteIcon: { flexShrink:0 },

  // Offline result badge
  offlineBadge: {
    display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(234,179,8,0.12)', border:'1px solid rgba(234,179,8,0.3)',
    color:'#fbbf24', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600,
  },
  offlineBadgeDot: {
    width:7, height:7, borderRadius:'50%', background:'#fbbf24',
    display:'inline-block', animation:'pulse 2s ease-in-out infinite',
  },
  offlineBadgeMs: { color:'rgba(251,191,36,0.6)', fontWeight:400 },
};