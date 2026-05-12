// PrivateBlast Service Worker
const CACHE_NAME = 'privateblast-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/onboarding.html',
  '/app.html',
  '/club.html',
  '/tracker.html',
  '/dj.html',
  '/owner.html',
  '/supabase-config.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
]

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS.filter(url => !url.startsWith('http'))).catch(() => {})
    }).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Skip non-GET and Supabase API calls (always go to network)
  if (event.request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('fonts.googleapis.com')) return
  if (url.hostname.includes('cdn.jsdelivr.net')) return

  event.respondWith(
    // Try network first
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const cloned = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned))
      }
      return response
    }).catch(() =>
      // Fall back to cache
      caches.match(event.request).then(cached => {
        if (cached) return cached
        // If navigating to a page that's not cached, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        return new Response('Offline', { status: 503 })
      })
    )
  )
})

// Background sync for offline blasts
self.addEventListener('sync', event => {
  if (event.tag === 'sync-blasts') {
    event.waitUntil(syncPendingBlasts())
  }
})

async function syncPendingBlasts() {
  // Sync any queued blasts when connection returns
  const clients = await self.clients.matchAll()
  clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }))
}

// Push notifications (future feature)
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'PrivateBlast', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})
