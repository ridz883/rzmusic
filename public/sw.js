const CACHE_NAME = 'rzmusic-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/home.js',
  '/player.js',
  '/miniplayer.js',
  '/fullplayer.js',
  '/search.js',
  '/artist.js',
  '/logo.png',
  '/dev.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Jangan cache API calls
  if (e.request.url.includes('/api/')) {
    return fetch(e.request);
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, res.clone());
          return res;
        });
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});
