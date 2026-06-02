const CACHE_NAME = 'sevaghar-v23'; // ← v23 kar diya

const urlsToCache = [
  './',
  './index.html',
  './track.html', // ← Ye add kar
  './employee.html',
  './Booking.html',
  './manifest.json',
  './style.css',
  './icon-192.png',
  './icon-512.png',
  './terms.html',
  './privacy.html',
  './refund.html'
];

// Install - Sab file cache kar
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
     .then(cache => {
        console.log('Cache khul gaya');
        return cache.addAll(urlsToCache);
      })
     .catch(err => console.log('Cache add error:', err))
  );
  self.skipWaiting();
});

// Activate - Purana cache delete kar
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
  // 1. Google Apps Script API calls ko cache mat karo
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Net nahi hai to khali response bhej do, error na aaye
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
        // Cache me mil gaya
        if (response) {
          return response;
        }
        // Cache me nahi mila, net se la
        return fetch(event.request).then(res => {
          // Net se mila to cache me bhi save kar le future ke liye
          if(res.status === 200){
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, resClone);
            });
          }
          return res;
        }).catch(() => {
          // Net bhi nahi aur cache me bhi nahi - HTML page maang raha hai to index.html de de
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});