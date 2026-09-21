/**
 * API 키 없이 브라우저에서 바로 호출할 수 있는 두 소스에서 표지 후보를 모은다.
 *  1) Google Books
 *  2) Jikan (MyAnimeList)
 * 실패하거나 결과가 없으면 조용히 빈 배열을 돌려준다.
 * (한국 웹툰은 어느 쪽에도 없을 수 있다 — 그래도 저장은 정상 동작해야 한다.)
 */

const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes'
const JIKAN = 'https://api.jikan.moe/v4/manga'

/** 구글 북스 썸네일을 조금 더 큰 이미지로 바꾸고 https 로 강제한다. */
function upgradeGoogleThumbnail(url: string): string {
  return url
    .replace(/^http:\/\//i, 'https://')
    .replace(/([?&])zoom=\d+/i, '$1zoom=2')
    .replace(/([?&])edge=curl/i, '$1edge=none')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`요청 실패: ${response.status}`)
  return response.json()
}

async function searchGoogleBooks(title: string, signal?: AbortSignal): Promise<string[]> {
  const url = `${GOOGLE_BOOKS}?q=${encodeURIComponent(title)}&maxResults=8`
  const data = asRecord(await fetchJson(url, signal))
  const items = Array.isArray(data?.items) ? data.items : []
  const out: string[] = []
  for (const item of items) {
    const info = asRecord(asRecord(item)?.volumeInfo)
    const links = asRecord(info?.imageLinks)
    const thumbnail = links?.thumbnail ?? links?.smallThumbnail
    if (typeof thumbnail === 'string' && thumbnail) {
      out.push(upgradeGoogleThumbnail(thumbnail))
    }
  }
  return out
}

async function searchJikan(title: string, signal?: AbortSignal): Promise<string[]> {
  const url = `${JIKAN}?q=${encodeURIComponent(title)}&limit=8`
  const data = asRecord(await fetchJson(url, signal))
  const items = Array.isArray(data?.data) ? data.data : []
  const out: string[] = []
  for (const item of items) {
    const jpg = asRecord(asRecord(asRecord(item)?.images)?.jpg)
    const image = jpg?.large_image_url ?? jpg?.image_url
    if (typeof image === 'string' && image) {
      out.push(image.replace(/^http:\/\//i, 'https://'))
    }
  }
  return out
}

/** 두 소스의 결과를 (구글 → 지칸 순서로) 합쳐 중복 없는 후보 목록으로 만든다. */
export async function searchCovers(title: string, signal?: AbortSignal): Promise<string[]> {
  const query = title.trim()
  if (!query) return []

  const [google, jikan] = await Promise.all([
    searchGoogleBooks(query, signal).catch(() => [] as string[]),
    searchJikan(query, signal).catch(() => [] as string[]),
  ])

  const seen = new Set<string>()
  const merged: string[] = []
  for (const url of [...google, ...jikan]) {
    if (seen.has(url)) continue
    seen.add(url)
    merged.push(url)
  }
  return merged.slice(0, 12)
}
