// UNI Path service worker — enables installability (PWA) + light offline support.
// Deliberately conservative: only handles page navigations and Next static assets.
// Never touches Supabase / API / RSC data requests.
const CACHE = "unipath-v2";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Only same-origin.
  if (url.origin !== self.location.origin) return;
  // Never intercept Next.js RSC/data navigations or anything with query params.
  if (url.search) return;

  // Page navigations: network-first, fall back to cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/")));
    return;
  }

  // Immutable Next static assets + our icons: cache-first.
  const isStatic = url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname);
  if (!isStatic) return; // let the browser handle everything else normally

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
    )
  );
});
