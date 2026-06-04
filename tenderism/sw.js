// Tenderism Service Worker — offline-first, self-contained cooking guide
const CACHE_NAME = 'tenderism-v1'
const PRECACHE = [
  '/tenderism/',
  '/tenderism/index.html',
  '/tenderism/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE.filter(u => !u.startsWith('http'))).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (!url.pathname.startsWith('/tenderism') && !url.hostname.includes('fonts.g')) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(resp => {
        if (resp && resp.status === 200) {
          const cloned = resp.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, cloned))
        }
        return resp
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('/tenderism/index.html')
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
