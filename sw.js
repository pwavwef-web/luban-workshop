// Luban Workshop Restaurant - Main Page Service Worker
const CACHE_NAME = 'luban-main-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.jpeg',
    '/logo.png',
    '/restcon.png',
    '/styles.css',
    '/script.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Silently fail if some assets are unavailable
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    // Network-first strategy: always try network, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses for static assets
                if (response.ok && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Handle push notifications (FCM background messages)
self.addEventListener('push', event => {
    if (!event.data) return;
    try {
        const data = event.data.json();
        const title = (data.notification && data.notification.title) || 'Luban Restaurant';
        const options = {
            body: (data.notification && data.notification.body) || '',
            icon: '/favicon.jpeg',
            badge: '/favicon.jpeg',
            data: data.data || {}
        };
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) { /* ignore parse errors */ }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('/index.html') || client.url === self.location.origin + '/') {
                    return client.focus();
                }
            }
            return clients.openWindow('/');
        })
    );
});
