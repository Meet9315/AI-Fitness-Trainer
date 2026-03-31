/**
 * Service Worker — AI Fitness Trainer
 * ====================================
 * Caches the app shell for offline resilience and fast load.
 * Uses a stale-while-revalidate strategy for most assets
 * and network-first for the MediaPipe WASM/model binaries.
 */

const CACHE_NAME = 'ai-fitness-trainer-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png',
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — stale-while-revalidate for app assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and WebSocket connections
  if (request.method !== 'GET') return;
  if (request.url.includes('/ws')) return;

  // Network-first for MediaPipe WASM/model files (large, versioned)
  if (request.url.includes('mediapipe') || request.url.includes('.wasm') || request.url.includes('.tflite')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache same-origin and successful responses
          if (response.ok && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
