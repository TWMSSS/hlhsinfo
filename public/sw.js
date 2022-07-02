/*
 * Service Worker for HLHSInfo
 * Created by: DevSomeone <yurisakadev@gmail.com>
 * 
 * Copyright 2022 The HLHSInfo Authors.
 * Copyright 2022 DevSomeone Developer.
 *
 * Repository: https://github.com/DevSomeone/hlhsinfo
 */

const VERSION = `v1.5.0-release`;

const cacheFiles = [
    '/css/main.css',
    '/css/dark-var.css',
    '/css/light-var.css',
    '/js/main.js',
    '/js/darkLight.js',
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
    '/js/page/donation.js',
    '/js/page/extra/scheduleForHome.js',
    '/js/page/extra/inAppPurchase.js',
    '/img/logo.png',
    '/index.html',
    '/manifest.json',
    '/',

    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'
];

const cacheName = `static-cache-${VERSION}`;
var oldVersion = null;
let getConvePort;
var isInstallNew = false;
var isUpdating = false;
var latestNotify = null;

function getNotify() {
    fetch("/api/notify").then(e => e.json()).then(e => {
        var data = e.slice(-1)[0];
        if (!latestNotify || data.id !== latestNotify.id && data.expire > Date.now()) {
            self.registration.showNotification(data.title, {
                body: data.description,
                icon: '/img/logo.png'
            });
            latestNotify = data;
        }
    });
}

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
    getNotify();
    var t = setTimeout(() => {
        if (isInstallNew && oldVersion !== null) {
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NEW_VERSION',
                        version: VERSION,
                    });
                });
            });
            clearTimeout(t);
        } else {
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'INSTALLED',
                        version: VERSION,
                    });
                });
            });
        }
        console.log('New version installed');
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
    if (event.data.type === "NOTIFY") {
        getConvePort.postMessage({
            type: "NOTIFY",
            payload: latestNotify
        });
    }
});

setInterval(getNotify, 3600000)