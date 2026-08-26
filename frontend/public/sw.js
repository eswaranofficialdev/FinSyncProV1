// public/sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// This fetch listener is strictly required by Chrome to trigger the PWA install prompt.
self.addEventListener('fetch', (event) => {
  // Pass through all requests normally
  event.respondWith(fetch(event.request));
});