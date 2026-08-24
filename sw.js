// Service Worker for Nova Library — minimal cache, self-cleaning
const CACHE_NAME = 'nova-library-v2';

// Only cache these local resources (no external images, no huge JSON)
const PRECACHE_URLS = [
  '/',
  '/index.html'
];

// Install event – precache tiny essentials only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(err => console.warn('SW precache failed (some assets may be offline):', err.message))
  );
  self.skipWaiting();
});

// Activate event – delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy:
// - For local assets (HTML, JS, CSS): cache-first (loads instantly offline)
// - For everything else (JSON, external images): network-first, no caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests (our own files)
  if (url.origin === self.location.origin) {
    // Cache-first for our own static files
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          // Don't cache JSON data
          if (url.pathname.includes('.json')) {
            return response;
          }
          // Cache other local files (CSS, JS) for offline access
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        }).catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('', { status: 503 });
        });
      })
    );
  } else {
    // External requests (images, API): network only – no caching in service worker
    event.respondWith(fetch(event.request));
  }
});