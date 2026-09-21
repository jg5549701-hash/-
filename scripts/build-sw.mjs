/**
 * 빌드가 끝난 dist/ 를 훑어 서비스 워커(dist/sw.js)를 만든다.
 * 에셋 파일명에 해시가 붙으므로 프리캐시 목록은 빌드 시점에만 알 수 있다.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DIST = 'dist'
/** 프리캐시하지 않을 파일 */
const SKIP = new Set(['sw.js'])

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const files = walk(DIST)
  .map((file) => relative(DIST, file).split(sep).join('/'))
  .filter((file) => !SKIP.has(file))
  .sort()

// 파일 내용이 하나라도 바뀌면 캐시 이름이 바뀌어 예전 캐시가 정리된다.
const hash = createHash('sha256')
for (const file of files) hash.update(file).update(readFileSync(join(DIST, file)))
const version = hash.digest('hex').slice(0, 12)

const precache = ['./', ...files.map((file) => `./${file}`)]

const sw = `/* 자동 생성 파일 — scripts/build-sw.mjs 가 만든다. 직접 고치지 말 것. */
const VERSION = ${JSON.stringify(version)}
const APP_CACHE = \`comic-log-app-\${VERSION}\`
const FONT_CACHE = 'comic-log-fonts'
const PRECACHE = ${JSON.stringify(precache, null, 2)}

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
`

writeFileSync(join(DIST, 'sw.js'), sw)
console.log(`sw.js 생성 — ${precache.length}개 프리캐시, 버전 ${version}`)
