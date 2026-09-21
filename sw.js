const CACHE_NAME = 'sevaghar-v25'; // ← v23 se v24 kar de, naya SW force hoga

const urlsToCache = [
  './',
  './index.html',
  './track.html',
  './employee.html',
  './Booking.html',
  './manifest.json',
  './style.css',
  './icon-192.png',
  './icon-512.png',
  './terms.html',
  './privacy.html',
  './refund.html'
  // DHYAN: services.json yaha nahi hai = sahi hai
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
    .catch(err => console.log('Cache add error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName!== CACHE_NAME) {
            console.log('Purana cache delete:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Offline First Strategy
self.addEventListener('fetch', event => {

  // ===== NAYA CODE - YE 4 LINE SABSE UPAR DAAL DE =====
  if (event.request.url.includes('services.json')) {
    return event.respondWith(fetch(event.request, {cache: 'no-store'}));
  }
  // ===== YAHI TAK =====

  // 1. Google Apps Script API calls ko cache mat karo
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({status: 'offline', msg: 'Net nahi hai'}), {
          headers: {'Content-Type': 'application/json'}
        });
      })
    );
    return;
  }

  // 2. Baaki sab file ke liye: Pehle cache, nahi mila to net
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true})
    .then(response => {
        if (response) return response;
        return fetch(event.request).then(res => {
          if(res.status === 200){
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return res;
        }).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
