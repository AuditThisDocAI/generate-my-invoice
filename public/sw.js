const CACHE_NAME = "invoice-creator-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("ServiceWorker pre-caching warning:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass API calls, Websockets, static builds and Google Firebase services
  if (
    url.pathname.startsWith("/api") || 
    url.pathname.includes("hot-update") ||
    event.request.method !== "GET" ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("identitytoolkit")
  ) {
    return;
  }

  // Capture SPA navigations and serve index.html when offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Stale-While-Revalidate caching model for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version from network in background to keep cache fresh
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {}); // ignore network exceptions for background fetch
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === "image") {
            // Placeholder SVG for offline missing images
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4f4f5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="10" font-weight="bold" fill="#71717a">Offline</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
        });
    })
  );
});
