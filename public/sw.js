//
//
// Service Worker for HLHSInfo
// Created by: DevSomeone <yurisakadev@gmail.com>
//
//

const VERSION = `v1.3.5`;

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
    '/'
];

const cacheName = `static-cache-${VERSION}`;
var oldVersion = null;
let getConvePort;
var isInstallNew = false;
var isUpdating = false;

self.addEventListener('install', async (event) => {
    self.skipWaiting();
    isUpdating = true;
    caches.open(cacheName).then((cache) => {
        return cache.addAll(cacheFiles);
    });
    isUpdating = false;
    isInstallNew = true;
});

self.addEventListener('activate', async (event) => {
    await caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames.map((cacheN) => {
                if (cacheN !== cacheName) {
                    oldVersion = cacheN.split("-")[2];
                    console.log('Deleting cache: ' + cacheN);
                    return caches.delete(cacheN);
                }
                return new Promise((resolve, reject) => { resolve(); });
            })
        );
    });
    self.clients.claim();
    var t = setTimeout(() => {
        if (isInstallNew) {
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NEW_VERSION',
                        version: VERSION,
                    });
                });
            });
            clearTimeout(t);
            console.log('New version installed');
        }
        isInstallNew = false;
        oldVersion = null;
    }, 1000);
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
        getConvePort.postMessage({
            type: 'INIT_CONVERSATION'
        });
    }

    if (event.data.type === 'VERSION') {
        getConvePort.postMessage({
            type: "VERSION",
            payload: oldVersion || VERSION
        });
    }
});