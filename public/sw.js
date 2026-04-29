// Service Worker — Cheffya
// Estratégia: cache-first para assets estáticos, stale-while-revalidate para imagens
const CACHE_STATIC = 'cheffya-static-v4'
const CACHE_IMAGES = 'cheffya-images-v4'

// Instalação: pré-cacheia o app shell
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      cache.addAll(['/', '/index.html']).catch(() => {})
    )
  )
})

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_IMAGES)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requests não-GET e cross-origin não relevantes
  if (request.method !== 'GET') return

  // ── Imagens do Supabase Storage → stale-while-revalidate ──
  // Serve do cache imediatamente + atualiza em background
  if (url.hostname === 'api.cheffya.com.br' && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then(async cache => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then(res => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // ── API Supabase (dados) → sempre network, sem cache ──
  if (url.hostname === 'api.cheffya.com.br') return

  // ── Assets estáticos (JS, CSS, fonts) → cache-first ──
  // Vite gera nomes com hash, então cache é sempre válido
  const isAsset = url.pathname.match(/\.(js|css|woff2?|ttf|png|svg|ico|webp|jpg)$/)
  if (isAsset) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            caches.open(CACHE_STATIC).then(c => c.put(request, res.clone()))
          }
          return res
        })
      })
    )
    return
  }

  // ── HTML (rotas SPA) → network-first com fallback para index.html ──
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE_STATIC).then(c => c.put(request, res.clone()))
          }
          return res
        })
        .catch(() =>
          caches.match('/index.html')
        )
    )
  }
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Cheffya', {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: !!data.requireInteraction,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus()
      return clients.openWindow('/')
    })
  )
})
