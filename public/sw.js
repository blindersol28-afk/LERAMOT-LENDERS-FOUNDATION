/* Leramot Lenders Foundation — Service Worker
   Strategy:
   - App shell (HTML / JS / CSS / fonts / images): Cache-first, update in background
   - API calls (/api/*): Network-only (always fresh data from server)
*/

const CACHE   = 'leramot-v1';
const API_PREFIX = '/api/';

// Assets to pre-cache on install (app shell)
const PRECACHE = [
  '/',
  '/logo.png',
  '/og-image.svg',
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to the network for API calls
  if (url.pathname.startsWith(API_PREFIX)) {
    return; // let the browser handle it normally
  }

  // For navigation requests (HTML pages), try network first so updates land fast
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // For everything else (JS, CSS, images, fonts): cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Serve from cache, refresh in background
        const refresh = fetch(request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE).then(c => c.put(request, response.clone()));
          }
          return response;
        }).catch(() => {});
        return cached;
      }
      // Not in cache — fetch and store
      return fetch(request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return response;
      });
    })
  );
});
