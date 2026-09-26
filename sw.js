const CACHE_NAME = "azmon-cache-v1";
const urlsToCache = [
  "/Azmon/",
  "/Azmon/index.html",
  "/Azmon/manifest.json"
  // اگه فایل CSS یا JS جدا دارید، آدرسشون رو هم اینجا اضافه کنید
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});
