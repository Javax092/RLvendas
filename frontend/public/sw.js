self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("rlburger-static-v1").then((cache) => cache.addAll(["/", "/favicon.svg", "/manifest.webmanifest"]))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).catch(() => cached);
    })
  );
});

