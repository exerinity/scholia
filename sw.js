const CACHE_NAME = "why-v4.5";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/LICENSE",
  "/README.md",
  "/RELNOTE.md",

  "/app/media/icon.png",
  "/app/media/icon.svg",

  "/app/scripts/controls.js",
  "/app/scripts/main.js",
  "/app/scripts/texting.js",

  "/app/stylesheets/app.css",

  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.destination === "font") {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return cache.match(request) || caches.match("/index.html");
  }
}
