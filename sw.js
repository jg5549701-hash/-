/* 자동 생성 파일 — scripts/build-sw.mjs 가 만든다. 직접 고치지 말 것. */
const VERSION = "3d82261a33e0"
const APP_CACHE = `comic-log-app-${VERSION}`
const FONT_CACHE = 'comic-log-fonts'
const PRECACHE = [
  "./",
  "./apple-touch-icon.png",
  "./assets/index-CNKEkxaj.js",
  "./assets/index-J7rCsTAI.css",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest"
]

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE)
      // 하나가 실패해도 설치 자체는 진행되도록 개별적으로 담는다.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('comic-log-app-') && name !== APP_CACHE)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 화면 이동: 오프라인에서도 열리도록 캐시된 index.html 을 먼저 준다.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cached = await caches.match('./index.html', { cacheName: APP_CACHE, ignoreSearch: true })
        if (cached) return cached
        try {
          return await fetch(request)
        } catch {
          return new Response('오프라인입니다.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }
      })(),
    )
    return
  }

  // 구글 폰트: 캐시를 먼저 주고 뒤에서 갱신한다 (오프라인에서도 글꼴 유지).
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONT_CACHE)
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
            return response
          })
          .catch(() => null)
        return cached ?? (await network) ?? Response.error()
      })(),
    )
    return
  }

  // 앱 자신의 파일: 캐시 우선.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { cacheName: APP_CACHE })
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(APP_CACHE)
            cache.put(request, response.clone())
          }
          return response
        } catch {
          return Response.error()
        }
      })(),
    )
    return
  }

  // 표지 검색 API·표지 이미지 같은 바깥 요청은 건드리지 않는다.
})
