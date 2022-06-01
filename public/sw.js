const cacheFiles = [
    '/css/main.css',
    '/css/dark-var.css',
    '/css/light-var.css',
    '/js/main.js',
    '/js/page/home.js',
    '/js/page/404.js',
    '/js/page/profile.js',
    '/js/page/availableScore.js',
    '/js/page/score.js',
    '/js/page/compare.js',
    '/js/page/lack.js',
    '/js/page/rewandpun.js',
    '/js/page/scheduleList.js',
    '/js/page/schedule.js',
    '/img/logo.png',
    '/index.html',
    '/manifest.json'
];

const cacheName = 'static-cache-v1.1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(cacheFiles);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== cacheName) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});