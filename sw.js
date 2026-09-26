// Service Worker - سامانه آزمون خوارزمی
const CACHE_NAME = "azmon-cache-v1";
const RUNTIME_CACHE = "azmon-runtime-v1";

// فایل‌های اصلی که باید همیشه در دسترس باشند (حتی آفلاین)
const CORE_ASSETS = [
  "/Azmon/",
  "/Azmon/index.html",
  "/Azmon/manifest.json",
  "/Azmon/icons/icon-192.png",
  "/Azmon/icons/icon-512.png"
];

// نصب: کش کردن فایل‌های اصلی
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی: پاک کردن کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// درخواست‌هایی که هرگز نباید کش بشن (چون داده‌ی زنده/حساس هستند)
const NEVER_CACHE_HOSTS = [
  "api.github.com",
  "docs.google.com",
  "raw.githubusercontent.com"
];

function shouldBypassCache(url) {
  return NEVER_CACHE_HOSTS.some((host) => url.hostname.includes(host));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // فقط درخواست‌های GET رو مدیریت کن
  if (req.method !== "GET") return;

  // درخواست‌های حساس (ثبت نتیجه، تنظیمات) همیشه از شبکه بیان، بدون کش
  if (shouldBypassCache(url)) {
    event.respondWith(fetch(req).catch(() => new Response("", { status: 504 })));
    return;
  }

  // رمز عبور و بانک سوالات (.txt): همیشه اول از شبکه، تا همیشه آخرین نسخه لود بشه
  if (url.pathname.endsWith(".txt")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // بقیه فایل‌ها (HTML, CSS, JS, فونت, تصاویر): کش اول، بعد شبکه (برای کارکرد آفلاین)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
