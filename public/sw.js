// Service Worker for Slolan - Prevents caching and ensures lock screen
const CACHE_NAME = 'slolan-cache-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't cache the main HTML file to ensure lock screen is always shown
  if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other resources, use network first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache HTML files
        if (response.headers.get('content-type')?.includes('text/html')) {
          return response;
        }
        
        // Cache other resources
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
}); 