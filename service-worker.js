const CACHE_NAME = 'kortex-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('KorteX Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('KorteX Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from Cache or Network, with SPA fallback
self.addEventListener('fetch', (event) => {
  // For navigation requests, use a network-first strategy with a fallback to the cached index.html.
  // This is crucial for single-page applications.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails (e.g., offline), or for any other fetch error,
        // serve the main index.html page from the cache.
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For all other requests (CSS, images, API calls, etc.), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the request is in the cache, return it.
      if (response) {
        return response;
      }

      // If the request is not in the cache, fetch it from the network.
      return fetch(event.request).then((networkResponse) => {
        // Don't cache opaque responses (e.g., from some CDNs) or non-200 responses.
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // Clone the response to cache it for future use.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});