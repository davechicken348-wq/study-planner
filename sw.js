// StudyPlanner Service Worker - enables offline functionality and caching
const CACHE_NAME = 'studyplanner-v1.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './tutorials.html',
  './contact.html',
  './faq.html',
  './features.html',
  './how-it-works.html',
  './mission.html',
  './for-students.html',
  './for-educators.html',
  './study-tips.html',
  './404.html',
  './styles.css',
  './tutorials.css',
  './app.js',
  './utils.js',
  './navigation.js',
  './tutorials.js',
  './tutorials.json',
  './favicon.svg',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap'
];

// Install: cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      // Cache only essential local assets - don't fail if some external assets fail
      const assets = STATIC_ASSETS.filter(url => 
        url.startsWith('./') || url.startsWith('/') || url === ''
      );
      return cache.addAll(assets).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
        // Continue even if some assets fail
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip third-party APIs (YouTube, Dev.to, GitHub)
  if (url.origin !== location.origin && 
      (url.hostname.includes('googleapis') || 
       url.hostname.includes('dev.to') || 
       url.hostname.includes('github'))) {
    return; // Let browser handle it normally
  }

  // Network first for API calls, cache first for assets
  if (request.method !== 'GET') {
    return; // Don't cache non-GET requests
  }

  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png')) {
    // Cache first for assets
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        });
      }).catch(() => {
        // Return a basic offline page if cache misses and no network
        if (url.pathname.includes('html')) {
          return caches.match('./index.html');
        }
      })
    );
  } else {
    // Network first for HTML pages
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) return response;
            // Fall back to home page if offline
            return caches.match('./index.html');
          });
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
