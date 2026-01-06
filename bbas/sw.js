// Service Worker for BBAS PWA

const CACHE_NAME = 'bbas-v1';
const BASE_PATH = '/bbas/';

const ASSETS_TO_CACHE = [
    `${BASE_PATH}`,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}manifest.json`,
    `${BASE_PATH}css/main.css`,
    `${BASE_PATH}css/camera.css`,
    `${BASE_PATH}css/boundary-editor.css`,
    `${BASE_PATH}css/alerts.css`,
    `${BASE_PATH}js/app.js`,
    `${BASE_PATH}js/components/Camera.js`,
    `${BASE_PATH}js/utils/logger.js`,
    `${BASE_PATH}js/config/constants.js`
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // Offline fallback
                console.log('[SW] Offline, no cache available for:', event.request.url);
            })
    );
});
