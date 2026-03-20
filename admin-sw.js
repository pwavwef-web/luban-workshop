// Luban Workshop Restaurant – Admin Dashboard Service Worker
const CACHE_NAME = 'luban-admin-v1';
const STATIC_ASSETS = [
  '/admin.html',
  '/admin-manifest.json',
  '/logo.png',
  '/favicon.jpeg'
];

// Install – pre-cache key admin assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

// Activate – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch – network first; serve cache as fallback for admin.html
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('firestore') || request.url.includes('googleapis') || request.url.includes('gstatic')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push – show notification for new orders / reservations / messages
self.addEventListener('push', event => {
  let data = { title: 'Luban Admin', body: 'New activity requires your attention.' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Luban Admin', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/favicon.jpeg',
      tag: data.tag || 'luban-admin-notification',
      requireInteraction: true,
      data: { url: '/admin.html' }
    })
  );
});

// Notification click – open admin dashboard
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/admin.html');
    })
  );
});
