const CACHE_NAME = 'finsync-v2';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing');

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');
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


self.addEventListener('fetch', (event) => {

  /*
   * Let the browser handle network requests normally.
   * We only need the service worker to control the app.
   */
  event.respondWith(
    fetch(event.request).catch(() => {

      return caches.match(event.request);

    })
  );

});

  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first / normal browser handling.
});
