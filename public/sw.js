/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const STATIC_CACHE = "ecomart-static-v2.0.0";
const DYNAMIC_CACHE = "ecomart-dynamic-v2.0.0";

// Assets to cache on install
const urlsToCache = [
  "/ecomart/",
  "/ecomart/static/css/main.fbb02b70.css",
  "/ecomart/static/js/main.fd9b5f8c.js",
  "/ecomart/manifest.json",
  "/ecomart/assets/images/logo.webp",
  "/ecomart/assets/images/hero-left.webp",
  "/ecomart/assets/images/hero2.webp",
  "/ecomart/assets/images/hero3.webp",
  "/ecomart/assets/images/promo-left.webp",
  "/ecomart/assets/images/promo-right.webp",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Precaching static assets");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[SW] Skip waiting");
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker");
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .map((cacheName) => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                console.log("[SW] Deleting old cache:", cacheName);
                return caches.delete(cacheName);
              }
              return null;
            })
            .filter(Boolean)
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests except for same-origin GitHub Pages
  if (url.origin !== location.origin && !url.hostname.includes("github.io")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        console.log("[SW] Serving from cache:", request.url);
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone the response
          const responseToCache = networkResponse.clone();

          // Determine cache strategy based on request type
          let cacheName = DYNAMIC_CACHE;

          // Cache static assets in static cache
          if (
            request.url.includes("/static/") ||
            request.url.includes("/assets/") ||
            request.url.includes(".webp") ||
            request.url.includes(".jpg") ||
            request.url.includes(".png") ||
            request.url.includes(".gif") ||
            request.url.includes(".svg") ||
            request.url.includes(".css") ||
            request.url.includes(".js") ||
            request.url.includes(".woff") ||
            request.url.includes(".woff2")
          ) {
            cacheName = STATIC_CACHE;
          }

          // Cache the response
          caches
            .open(cacheName)
            .then((cache) => {
              console.log("[SW] Caching new resource:", request.url);
              return cache.put(request, responseToCache);
            })
            .catch((error) => {
              console.error("[SW] Cache put error:", error);
            });

          return networkResponse;
        })
        .catch((error) => {
          console.error("[SW] Fetch failed:", error);
          // Return offline fallback if available
          if (request.mode === "navigate") {
            return caches.match("/ecomart/");
          }
          throw error;
        });
    })
  );
});
