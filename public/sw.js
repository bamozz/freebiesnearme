// Minimal service worker whose only job is to satisfy Chrome's PWA
// installability requirement (a registered SW with a fetch handler) so
// `beforeinstallprompt` actually fires - see InstallBanner. No offline
// caching: every request just passes straight through to the network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
