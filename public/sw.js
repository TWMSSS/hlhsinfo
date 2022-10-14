/*
 * Service Worker for HLHSInfo
 * Created by: DevSomeone <yurisakadev@gmail.com>
 * 
 * Copyright 2022 The HLHSInfo Authors.
 * Copyright 2022 DevSomeone Developer.
 *
 * Repository: https://github.com/TWMSSS/hlhsinfo
 */

const VERSION = `v1.7.1-release`;

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
    '/js/page/statement.js',
    '/js/page/extra/scheduleForHome.js',
    '/js/page/extra/inAppPurchase.js',
    '/img/logo.png',
    '/img/deny.webp',
    '/img/deny-large.webp',
    '/img/operational.webp',
    '/img/operational-large.webp',
    '/index.html',
    '/status.html',
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
var isNotifyFetched = false;
var isNotifyFetching = false;
var isInitDB = false;

var idb = globalThis.indexedDB ||
    globalThis.mozIndexedDB ||
    globalThis.webkitIndexedDB;

var db;

(async () => {
    await initIndexedDB();
})();

function getNotify() {
    if (isNotifyFetching) return;
    return new Promise(async (resolve, reject) => {
        isNotifyFetching = true;
        function waitForDBInit() {
            return new Promise(async (resolve, reject) => {
                if (isInitDB) {
                    resolve();
                } else {
                    setTimeout(async () => resolve(await waitForDBInit()), 300);
                }
            });
        }
        await waitForDBInit();
        fetch("/api/notify").then(e => e.json()).then(async e => {
            var data = e.slice(-1)[0];
            var notifyData = await getNotifyDB();
            var lastNotify = notifyData.slice(-1)[0];
            if (notifyData.length === 0 || data.id !== lastNotify.notifyid && data.expire > Date.now()) {
                self.registration.showNotification(data.title, {
                    body: data.description,
                    icon: '/img/logo.png'
                });
                addNotifyBD(data);
            }
            isNotifyFetched = true;
            isNotifyFetching = false;
            resolve(true);
        });
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
    await getNotify();
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

self.addEventListener('message', async (event) => {
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
        function waitForFetched() {
            return new Promise(async (resolve, reject) => {
                if (isNotifyFetched) {
                    resolve();
                } else {
                    setTimeout(async () => resolve(await waitForFetched()), 300);
                    getNotify();
                }
            });
        }
        await waitForFetched();
        var notifyData = (await getNotifyDB()).slice(-1)[0];
        getConvePort.postMessage({
            type: "NOTIFY",
            payload: notifyData
        });
    }
});

self.addEventListener('sync', function (event) {
    if (event.tag === 'syncNotify') {
        event.waitUntil(getNotify());
    }
});

async function initIndexedDB() {
    function a() {
        return new Promise((resolve, reject) => {
            var request = idb.open("serviceWorker", 1);
            var t = false;
            request.onupgradeneeded = (upgradeDb) => {
                t = true;
                db = request.result;
                if (!db.objectStoreNames.contains('notify')) {
                    var objectStore = upgradeDb.currentTarget.result.createObjectStore('notify', { keyPath: "notifyid", autoIncrement: true });
                    objectStore.createIndex('notifyid', 'notifyid', { unique: true });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('description', 'description', { unique: false });
                    objectStore.createIndex('expire', 'expire', { unique: false });
                }
                setTimeout(() => {
                    isInitDB = true;
                    return resolve(true);
                }, 500);
            };
            request.onsuccess = (event) => {
                db = request.result;
                setTimeout(() => {
                    isInitDB = true;
                    return resolve(true);
                }, 500);
            };
            request.onerror = (event) => {
                console.log(event)
            };
        });
    }
    await a();
    return db;
}

async function addNotifyBD(data) {
    var transaction = db.transaction(["notify"], "readwrite");
    objectStore = transaction.objectStore("notify");
    objectStore.add({
        notifyid: data.id,
        title: data.title,
        description: data.description,
        expire: data.expire,
        showInHome: data.showInHome
    });

    return true;
}

async function getNotifyDB(dbKey) {
    function b() {
        return new Promise((resolve, reject) => {
            var transaction = db.transaction(["notify"], "readwrite");

            transaction.onerror = (event) => {
                console.error(event)
            };

            objectStore = transaction.objectStore("notify");
            try {
                if (!dbKey) {
                    var data = objectStore.getAll();
                } else {
                    var data = objectStore.get(dbKey);
                }
            } catch (e) {
                return resolve(false);
            }
            data.onsuccess = (event) => {
                if (event.target.result) {
                    return resolve(event.target.result);
                };
                resolve(false);
            }
            data.onerror = (event) => {
                resolve(false);
            }
        });
    }
    var dbStatus = await b();
    if (dbStatus) {
        return dbStatus;
    }
    return false;
}

// setInterval(getNotify, 3600000)