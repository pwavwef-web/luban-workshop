// Luban Workshop Restaurant – Main Site Service Worker
const CACHE_NAME = 'luban-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.jpeg',
  '/styles.css',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap'
];

// Install – pre-cache static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://cdn')))
    ).catch(() => {})
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

// Fetch – network first, fallback to cache for navigation requests
self.addEventListener('fetch', event => {
  const { request } = event;
  // Only handle GET requests
  if (request.method !== 'GET') return;
  // Skip Firebase / Google APIs
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

// Push – show notification when server sends a push message
self.addEventListener('push', event => {
  let data = { title: 'Luban Workshop', body: 'You have a new update.' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Luban Workshop', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/favicon.jpeg',
      tag: data.tag || 'luban-notification',
      data: data.url ? { url: data.url } : {}
    })
  );
});

// Notification click – focus or open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
