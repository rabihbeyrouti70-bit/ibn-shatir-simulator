/* Service Worker for Ibn al-Shatir Astronomical Simulator */
const CACHE_NAME = 'ibn-shatir-v1.0.6';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/astronomy-core.js',
  './js/prayer-core.js',
  './js/i18n.js',
  './data/astro-data.js',
  './data/cities.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// Install: Pre-cache local assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Remove stale caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for local assets (ensures latest updates, falls back to cache offline), Cache-first for CDN/external resources
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // If local origin (or same directory relative path)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(req);
      })
    );
  } else {
    // External resources (CDN fonts, Three.js, etc.)
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, responseToCache));
          return networkResponse;
        }).catch(() => {
          return cachedResponse || new Response('Offline resource unavailable', { status: 503 });
        });
      })
    );
  }
});
