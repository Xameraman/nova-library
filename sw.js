/* Nova Library service worker — conservative cache-first/static + stale-while-revalidate data. */
const VERSION = 'v4.5';
const STATIC_CACHE = `nova-static-${VERSION}`;
const DATA_CACHE = `nova-data-${VERSION}`;
const IMAGE_CACHE = `nova-images-${VERSION}`;
const MAX_IMAGE_ENTRIES = 40;
const MAX_DATA_ENTRIES = 55;
const PRECACHE = ['/', '/index.html', '/nova-themes.js', '/sw.js', '/manifest.webmanifest'];

function isCacheableResponse(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'cors' || response.type === 'opaque');
}

async function trimCache(name, maxEntries) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const remove = keys.slice(0, keys.length - maxEntries);
  await Promise.all(remove.map(k => cache.delete(k)));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, DATA_CACHE, IMAGE_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('nova-') && !keep.has(k)).map(k => caches.delete(k)));
    await trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES).catch(() => {});
    await trimCache(DATA_CACHE, MAX_DATA_ENTRIES).catch(() => {});
    await self.clients.claim();
  })());
});

async function networkAndCache(request, cacheName, maxEntries) {
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await trimCache(cacheName, maxEntries).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // NOVA's same-origin proxy must never be cached. In particular, /status
  // contains the current Turnstile/session state; caching it can make the
  // browser believe verification is still required (or already complete).
  if (url.pathname === '/api/nova' || url.pathname.startsWith('/api/nova/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Keep third-party APIs/video embeds network-only. This avoids storing tokens,
  // AI responses, challenge responses, or large third-party content.
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  const isNavigation = request.mode === 'navigate';
  const isData = /\/packs(?:_\d+)?\.json$/i.test(url.pathname) || /\/packs_index\.json$/i.test(url.pathname);
  const isImage = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname);

  if (isData) {
    // Stale-while-revalidate: instant cached data, quiet background update.
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      const cached = await cache.match(request);
      const refresh = fetch(request).then(async response => {
        if (isCacheableResponse(response)) {
          await cache.put(request, response.clone());
          await trimCache(DATA_CACHE, MAX_DATA_ENTRIES).catch(() => {});
        }
        return response;
      }).catch(() => null);
      if (cached) {
        event.waitUntil(refresh.then(() => undefined));
        return cached;
      }
      const fresh = await refresh;
      return fresh || new Response('[]', { status: 503, headers: { 'Content-Type': 'application/json' } });
    })());
    return;
  }

  if (isImage) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try { return await networkAndCache(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES); }
      catch { return new Response('', { status: 503 }); }
    })());
    return;
  }

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (isCacheableResponse(response)) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match('/index.html')) || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Local static resources: cache-first, with network fallback.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try { return await networkAndCache(request, STATIC_CACHE, 20); }
    catch { return new Response('', { status: 503 }); }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
