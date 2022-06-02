//
//
// Service Worker for HLHSInfo
// Created by: DevSomeone <yurisakadev@gmail.com>
//
//

const VERSION = `v1.3.0`;

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
    '/js/page/extra/scheduleForHome.js',
    '/img/logo.png',
    '/index.html',
    '/manifest.json',
    '/',

    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'
];

const cacheName = `static-cache-${VERSION}`;
let getConvePort;

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
                cacheNames.map((cacheN) => {
                    if (cacheN !== cacheName) {
                        console.log('Deleting cache: ' + cacheN);
                        return caches.delete(cacheN);
                    }
                })
            );
        }),
        self.clients.claim()
    );
});

self.addEventListener('fetch', (event) => {
    // Cache match cacheName
    event.respondWith(
        caches.match(event.request).then(async (response) => {
            if (event.request.url.indexOf('/api/') === -1 && response) {
                return response;
            }
            return fetch(event.request);
        }).catch(e => {
            return caches.match('/');
        })
    );
});

self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'INIT_CONVERSATION') {
        getConvePort = event.ports[0];
    }

    if (event.data.type === 'VERSION') {
        getConvePort.postMessage({
            type: "VERSION",
            payload: VERSION
        });
    }
});