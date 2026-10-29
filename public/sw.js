/*
 * Bürgerweg service worker: makes the web app work offline after the first visit.
 * - Pages (navigations): network first, falling back to the cached page or the app shell.
 * - Static files (hashed bundles, images, fonts): cache first.
 * VERSION is replaced with the app version at build time (scripts/build-site.mjs), so every release changes this
 * file: browsers then install the new worker, which drops the old caches.
 */
const VERSION = 'dev';
const CACHE = `buergerweg-${VERSION}`;
const SCOPE = new URL(self.registration.scope).pathname; // e.g. "/app/"
const SHELL = [SCOPE, `${SCOPE}manifest.webmanifest`, `${SCOPE}icons/icon-192.png`, `${SCOPE}icons/icon-512.png`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('buergerweg-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  // The update check must always ask the server.
  if (url.pathname === `${SCOPE}version.json`) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(SCOPE))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
