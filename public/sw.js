const CACHE_NAME = 'kronometa-v1'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Solo cachea GET requests
  if (event.request.method !== 'GET') return

  // No cachea llamadas a Supabase
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})