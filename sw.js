const CACHE = "harlie-space-v120";
const ASSETS = [
    "./",
    "./index.html",
    "./home.js",
    "./game.html",
    "./playground.html",
    "./game.css",
    "./public/fonts/SupremeSpike-KVO8D.otf",
    "./game.js",
    "./manifest.webmanifest",
    "./public/favicon_io/favicon.ico",
    "./public/favicon_io/favicon-16x16.png",
    "./public/favicon_io/favicon-32x32.png",
    "./public/favicon_io/apple-touch-icon.png",
    "./public/favicon_io/android-chrome-192x192.png",
    "./public/favicon_io/android-chrome-512x512.png",
    "./public/images/ships/ship-1.png",
    "./public/images/ships/cat.png",
    "./public/images/ships/wolf.png",
    "./public/images/ships/cube.png",
    "./public/images/ships/hello-kitty.png",
    "./public/images/ships/ufo.png",
    "./public/images/ships/harlie.png",
    "./public/images/ships/selah.png",
    "./public/images/ships/guitar.png",
    "./public/images/ships/selah-harlie.png",
];

// Audio is ~9MB and cache.addAll() is all-or-nothing, so precaching it stalled
// install (and failed the whole batch on one flaky request). The fetch handler
// below caches these on first play instead, which is before they are audible.

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type === "opaque") {
                    return response;
                }
                const copy = response.clone();
                caches.open(CACHE).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(() => caches.match("./index.html"));
        })
    );
});
