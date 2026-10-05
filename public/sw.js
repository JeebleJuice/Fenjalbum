const CACHE = "fenjalbum-shell-v1";
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/login"]))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.url.includes("/api/") || request.mode === "navigate") return;
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => { if (response.ok && new URL(request.url).origin === location.origin) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
});
