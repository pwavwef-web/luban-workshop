// Luban Workshop Restaurant - Main Page Service Worker
const CACHE_NAME = 'luban-main-v8';
const MENU_CACHE_NAME = 'luban-menu-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/menu.html',
    '/manifest.json',
    '/logo.png',
    '/assets/restcon-768.jpg',
    '/assets/restcon-1280.jpg',
    '/assets/restcon-1920.jpg',
    '/assets/luban-noodle-spread.jpg',
    '/assets/luban-noodle-spread-480.jpg',
    '/tailwind.css',
    '/homepage.css',
    '/assets/css/site.css',
    '/script.js',
    '/assets/js/site-header.js',
    '/assets/js/site-footer.js',
    '/assets/js/site-config.js',
    '/assets/js/luban-client.js',
    '/assets/js/customer-experience.js',
    '/assets/js/firebase-config.js',
    '/assets/js/firebase-modular.bundle.js',
    '/assets/js/firebase-firestore.bundle.js',
    '/assets/js/lucide.bundle.js',
    '/assets/js/html2canvas.bundle.js',
    '/assets/js/firebase-ai-chatbot.js'
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
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== MENU_CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Cache Firestore API responses for offline menu browsing
    if (url.hostname === 'firestore.googleapis.com') {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(MENU_CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Network-first strategy for everything else
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request, { ignoreSearch: true }))
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
            icon: '/logo.png',
            badge: '/logo.png',
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
