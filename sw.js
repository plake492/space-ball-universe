const CACHE = "harlie-space-v21";
const ASSETS = [
    "./",
    "./index.html",
    "./game.css",
    "./game.js",
    "./manifest.webmanifest",
    "./public/icons/icon-192.png",
    "./public/icons/icon-512.png",
    "./public/icons/icon-512-maskable.png",
    "./public/icons/apple-touch-icon.png",
    "./public/images/ships/ship-1.png",
    "./public/images/ships/cat.png",
    "./public/images/ships/wolf.png",
    "./public/images/ships/cube.png",
    "./public/images/ships/hello-kitty.png",
    "./public/images/ships/ufo.png",
    "./public/audio/ship/freesound_community-spacecraft-engine-loop-01-58205.mp3",
    "./public/audio/balls/audio_319c456817.mp3",
    "./public/audio/atmosphere/drone-outerspace-hum-danijel-zambo-1-02-27.mp3",
];

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
