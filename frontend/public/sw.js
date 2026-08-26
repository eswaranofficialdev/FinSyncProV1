const CACHE_NAME = 'finsync-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing');

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');

  event.waitUntil(
    self.clients.claim()
  );
});
