const CACHE_NAME = "lovify-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/style1.css",
  "/supabase.js",
  "/src/app.js"
];

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache =>
          cache.addAll(APP_SHELL)
        )
    );
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
    );
  }
);

self.addEventListener(
  "fetch",
  (event) => {
    if (
      event.request.method !== "GET"
    ) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() =>
          caches.match(event.request)
        )
    );
  }
);