// Nudge Service Worker — caches static assets for instant repeat loads
const CACHE_NAME = 'nudge-v2';
const STATIC_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // Cache-first for static assets (JS, CSS, fonts, images)
  if (url.origin === self.location.origin) {
    if (url.pathname.match(/\.(js|css|svg|png|jpg|woff2|ico|manifest\.json)$/)) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      );
    }
    
    // Network-first for pages (so users get fresh content)
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
      );
    }
  }
});
