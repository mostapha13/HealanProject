/* Healan Clinic PWA service worker — network-first for app shell, cache static assets */
const CACHE = 'healan-clinic-pwa-v1';
const PRECACHE = ['/mobile/', '/mobile/manifest.json', '/mobile/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/mobile')) return;

  // Never cache API-ish or auth
  if (url.pathname.includes('/Healan/') || url.pathname.includes('/File/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.ok && (url.pathname.includes('/_expo/') || url.pathname.match(/\.(js|css|png|jpg|webp|svg|woff2?)$/))) {
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/mobile/')))
  );
});
