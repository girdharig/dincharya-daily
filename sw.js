// Service worker: lets Dincharya work offline and install like an app.
// Bump VERSION when you release changes so phones drop the old copy.
const VERSION = "dina-2026-11-04";
const SHELL = ["/", "/app", "/about", "/traditions", "/stories", "/healthy", "/mindful", "/faq", "/feedback", "/privacy", "/style.css", "/common.js", "/astro.js", "/site.js", "/config.js", "/favicon.svg", "/img/hero.svg", "/img/lights.svg", "/img/h-lanterns.svg", "/img/h-river.svg", "/icons/icon-192.png"];
const NEVER_CACHE = /^\/(admin|confirm|unsubscribe|preferences)(\/|$|\.)/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || NEVER_CACHE.test(url.pathname)) return; // network only
  const isImage = /\.(svg|png|jpg|webp)$/.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (isImage) {                       // images: cache first
      const hit = await cache.match(req); if (hit) return hit;
    }
    try {                                // everything else: network first, so updates show straight away
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {                      // offline
      const hit = await cache.match(req) || (req.mode === "navigate" ? await cache.match("/app") : null);
      return hit || new Response("You're offline.", {status: 503, headers: {"Content-Type": "text/plain"}});
    }
  })());
});
