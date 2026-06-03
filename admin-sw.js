// Luban Workshop Restaurant - Admin Dashboard Service Worker
const CACHE_NAME = 'luban-admin-v3';
const STATIC_ASSETS = [
    '/admin.html',
    '/admin-manifest.json',
    '/logo.png',
    '/assets/js/admin-bao-icons.js',
    '/assets/icons/admin-bao/admin-users.svg',
    '/assets/icons/admin-bao/approve.svg',
    '/assets/icons/admin-bao/archive.svg',
    '/assets/icons/admin-bao/brand.svg',
    '/assets/icons/admin-bao/chatbot.svg',
    '/assets/icons/admin-bao/chef.svg',
    '/assets/icons/admin-bao/close.svg',
    '/assets/icons/admin-bao/copy.svg',
    '/assets/icons/admin-bao/dashboard.svg',
    '/assets/icons/admin-bao/delete.svg',
    '/assets/icons/admin-bao/download.svg',
    '/assets/icons/admin-bao/edit.svg',
    '/assets/icons/admin-bao/fraud-review.svg',
    '/assets/icons/admin-bao/hide.svg',
    '/assets/icons/admin-bao/image.svg',
    '/assets/icons/admin-bao/loader.svg',
    '/assets/icons/admin-bao/logout.svg',
    '/assets/icons/admin-bao/map.svg',
    '/assets/icons/admin-bao/menu-manager.svg',
    '/assets/icons/admin-bao/menu-toggle.svg',
    '/assets/icons/admin-bao/messages.svg',
    '/assets/icons/admin-bao/no-email.svg',
    '/assets/icons/admin-bao/open-link.svg',
    '/assets/icons/admin-bao/orders.svg',
    '/assets/icons/admin-bao/print.svg',
    '/assets/icons/admin-bao/profile-review.svg',
    '/assets/icons/admin-bao/promotions.svg',
    '/assets/icons/admin-bao/refresh.svg',
    '/assets/icons/admin-bao/reject.svg',
    '/assets/icons/admin-bao/reservations.svg',
    '/assets/icons/admin-bao/revert.svg',
    '/assets/icons/admin-bao/settings.svg',
    '/assets/icons/admin-bao/show.svg',
    '/assets/icons/admin-bao/sparkles.svg',
    '/assets/icons/admin-bao/special-menus.svg'
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
    // Network-first: always fresh data for admin, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Handle push notifications (FCM background messages for admin)
self.addEventListener('push', event => {
    if (!event.data) return;
    try {
        const data = event.data.json();
        const title = (data.notification && data.notification.title) || 'Luban Admin';
        const options = {
            body: (data.notification && data.notification.body) || '',
            icon: '/logo.png',
            badge: '/logo.png',
            requireInteraction: true,
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
                if (client.url.includes('/admin.html')) {
                    return client.focus();
                }
            }
            return clients.openWindow('/admin.html');
        })
    );
});
