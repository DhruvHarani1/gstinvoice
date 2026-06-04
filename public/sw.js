const CACHE_NAME = 'invoicewala-cache-v1';
const OFFLINE_URLS = [
  '/dashboard',
  '/dashboard/invoices',
  '/dashboard/clients',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Allow individual assets to fail without blocking installation
      return Promise.allSettled(
        OFFLINE_URLS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`Failed to precache ${url}:`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API, Supabase, or Dev-Server hot-reload requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/supabase/') ||
    event.request.url.includes('/_next/') ||
    event.request.url.includes('hot-reloader') ||
    event.request.url.includes('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful document/asset GET responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when network is offline/unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If we fail on a navigation request (page refresh), redirect to cached dashboard root
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
          return new Response('Offline: Connection lost.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});
