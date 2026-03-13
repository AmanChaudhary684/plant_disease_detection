/**
 * offlineInference.js — LeafDoc AI
 * DTI Project | Innovation #1: Offline-First Architecture
 */

const MODEL_URL       = '/models/plant_disease_offline.onnx';
const CLASS_NAMES_URL = '/models/class_names.json';

const MEAN = [0.485, 0.456, 0.406];
const STD  = [0.229, 0.224, 0.225];
const IMG_SIZE = 224;

let session    = null;
let classNames = null;
let loadStatus = 'idle';

// ── Configure ONNX Runtime — local WASM, no CDN ───────────────────────────
async function configureOrt() {
  const ort = await import('onnxruntime-web');
  ort.env.wasm.wasmPaths = '/node_modules/onnxruntime-web/dist/';
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = false;
  return ort;
}

// ── Load Model ────────────────────────────────────────────────────────────
export async function loadOfflineModel(onProgress = null) {
  if (loadStatus === 'ready') return true;
  if (loadStatus === 'loading') return false;

  loadStatus = 'loading';
  try {
    if (onProgress) onProgress(10, 'Loading class names...');

    const classRes = await fetch(CLASS_NAMES_URL);
    if (!classRes.ok) throw new Error('class_names.json not found in /public/models/');
    classNames = await classRes.json();

    if (onProgress) onProgress(25, 'Initializing ONNX Runtime...');

    const ort = await configureOrt();

    if (onProgress) onProgress(40, 'Loading model into browser (first time only)...');

    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });

    loadStatus = 'ready';
    if (onProgress) onProgress(100, 'Model ready!');
    console.log('✅ Offline model loaded! Classes:', classNames.length);
    return true;

  } catch (err) {
    loadStatus = 'error';
    console.error('Offline model load failed:', err);
    throw err;
  }
}

export function getOfflineModelStatus() {
  return loadStatus;
}

// ── Preprocess Image ──────────────────────────────────────────────────────
async function preprocessImage(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = IMG_SIZE;
      canvas.height = IMG_SIZE;
      const ctx = canvas.getContext('2d');

      const scale = 256 / Math.min(img.width, img.height);
      const sw    = img.width  * scale;
      const sh    = img.height * scale;
      const sx    = (sw - IMG_SIZE) / 2;
      const sy    = (sh - IMG_SIZE) / 2;
      ctx.drawImage(img, -sx, -sy, sw, sh);

      const pixels = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE).data;
      const tensor = new Float32Array(3 * IMG_SIZE * IMG_SIZE);
      for (let i = 0; i < IMG_SIZE * IMG_SIZE; i++) {
        const r = pixels[i * 4]     / 255;
        const g = pixels[i * 4 + 1] / 255;
        const b = pixels[i * 4 + 2] / 255;
        tensor[i]                          = (r - MEAN[0]) / STD[0];
        tensor[IMG_SIZE * IMG_SIZE + i]     = (g - MEAN[1]) / STD[1];
        tensor[2 * IMG_SIZE * IMG_SIZE + i] = (b - MEAN[2]) / STD[2];
      }
      resolve(tensor);
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

// ── Softmax ───────────────────────────────────────────────────────────────
function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps     = logits.map(x => Math.exp(x - maxLogit));
  const sumExps  = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sumExps);
}

// ── Run Inference ─────────────────────────────────────────────────────────
export async function runOfflineInference(imageSource) {
  if (loadStatus !== 'ready' || !session || !classNames) {
    throw new Error('Offline model not loaded. Call loadOfflineModel() first.');
  }

  const ort = await configureOrt();

  const tensorData  = await preprocessImage(imageSource);
  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, IMG_SIZE, IMG_SIZE]);

  const startTime   = performance.now();
  const results     = await session.run({ input: inputTensor });
  const inferenceMs = Math.round(performance.now() - startTime);

  const logits = Array.from(results.output.data);
  const probs  = softmax(logits);

  const indexed = probs.map((p, i) => ({ idx: i, prob: p }));
  indexed.sort((a, b) => b.prob - a.prob);
  const top5 = indexed.slice(0, 5);

  const predictions = top5.map(({ idx, prob }) => ({
    class_id:       classNames[idx],
    display_name:   classNames[idx].replace(/___/g, ' — ').replace(/_/g, ' '),
    confidence:     Math.round(prob * 10000) / 100,
    confidence_raw: prob,
  }));

  const topClass  = predictions[0].class_id;
  const isHealthy = topClass.toLowerCase().includes('healthy');

  return {
    success:      true,
    offline:      true,
    mode:         'offline',
    inference_ms: inferenceMs,
    timestamp:    new Date().toISOString(),
    diagnosis: {
      top_prediction:   predictions[0],
      all_predictions:  predictions,
      is_healthy:       isHealthy,
      confidence_level: predictions[0].confidence > 80 ? 'High'
                      : predictions[0].confidence > 60 ? 'Medium'
                      : 'Low — consider expert consultation',
    },
    disclaimer: 'Offline diagnosis using on-device model. For high-value crops, please verify online when connectivity is available.',
  };
}

// ── Service Worker Registration ───────────────────────────────────────────
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', reg.scope);
      return true;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
      return false;
    }
  }
  return false;
}

// ── Online/Offline Detection ──────────────────────────────────────────────
export function isOnline() {
  return navigator.onLine;
}

export function onConnectivityChange(callback) {
  window.addEventListener('online',  () => callback(true));
  window.addEventListener('offline', () => callback(false));
}