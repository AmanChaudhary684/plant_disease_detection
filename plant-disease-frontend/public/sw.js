/**
 * sw.js — LeafDoc AI Service Worker
 * DTI Project | Innovation #1: Offline-First Architecture
 *
 * Caches the app shell, ONNX model, and static assets.
 * After first visit, the entire app works with zero internet.
 *
 * Place this file in: public/sw.js  (Vite serves public/ at root)
 */

const CACHE_NAME    = 'leafdoc-v1';
const MODEL_CACHE   = 'leafdoc-model-v1';

// App shell — cache these on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/models/class_names.json',
];

// ── Install: cache app shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Some shell assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== MODEL_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fallback to network ───────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // During development — let everything pass through directly
  if (url.hostname === 'localhost') {
    return; // ← Don't intercept localhost at all
  }

  // ONNX model — cache-first (production only)
  if (url.pathname.endsWith('.onnx') || url.pathname.includes('/models/')) {
    event.respondWith(
      caches.open(MODEL_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => {
        return new Response('Model not cached yet. Please connect to internet once to download.', { status: 503 });
      })
    );
    return;
  }

  // API calls — network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, offline: true, message: 'Server not reachable.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }
});