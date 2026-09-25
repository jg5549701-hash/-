import { SCORE_KEYS, type Manga, type ScoreKey, type Scores } from '../types'
import { clampScore } from './rating'
import { toEpisodeCount } from './episodes'

export const STORAGE_KEY = 'my-manga-list-v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toScore(value: unknown): number | undefined {
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || !Number.isFinite(num)) return undefined
  return clampScore(num)
}

function toGenres(value: unknown): string[] {
  // 예전 형식: "로맨스, 판타지" 같은 문자열도 받아준다.
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    const genre = toText(item).trim()
    if (!genre || seen.has(genre)) continue
    seen.add(genre)
    out.push(genre)
  }
  return out
}

function toScores(value: unknown): Scores {
  if (!isRecord(value)) return {}
  const out: Scores = {}
  for (const key of SCORE_KEYS) {
    const score = toScore(value[key])
    if (score !== undefined) out[key as ScoreKey] = score
  }
  return out
}

function toTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now()
}

export function createId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 저장된 항목 하나를 현재 스키마로 보정한다.
 * 필드가 없거나 타입이 다르면 기본값을 채우므로, 나중에 필드를 추가해도
 * 예전에 저장된 기록이 그대로 살아있다.
 */
export function migrateItem(raw: unknown): Manga | null {
  if (!isRecord(raw)) return null

  const scores = toScores(raw.scores)
  const id = toText(raw.id).trim() || createId()
  const rating = toScore(raw.rating) ?? 0

  // ratingAuto 가 없던 시절의 기록: 전체 평점이 따로 저장돼 있으면 그 값을
  // 존중하고(수동), 아니면 기본값인 자동 계산으로 둔다.
  const ratingAuto =
    typeof raw.ratingAuto === 'boolean' ? raw.ratingAuto : !('rating' in raw && rating > 0)

  // 전체 화수 0 은 "모름"과 같게 본다.
  const totalEpisodes = toEpisodeCount(raw.totalEpisodes) || undefined
  const readEpisodes = toEpisodeCount(raw.readEpisodes) ?? 0

  // 완독 체크가 없던 시절의 기록: 마지막 화까지 읽었으면 완독으로 본다.
  // (그때는 화수만으로 완독을 판단했으므로 보이던 상태를 그대로 유지한다)
  const finishedReading =
    typeof raw.finishedReading === 'boolean'
      ? raw.finishedReading
      : totalEpisodes !== undefined && readEpisodes >= totalEpisodes

  return {
    id,
    title: toText(raw.title).trim(),
    author: toText(raw.author).trim(),
    genres: toGenres(raw.genres),
    cover: toText(raw.cover).trim(),
    rating,
    ratingAuto,
    scores,
    review: toText(raw.review),
    totalEpisodes,
    readEpisodes,
    seriesCompleted: raw.seriesCompleted === true,
    finishedReading,
    createdAt: toTimestamp(raw.createdAt),
  }
}

/** 배열 전체를 보정한다. 살릴 수 없는 항목만 버린다. */
export function migrateList(raw: unknown): Manga[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: Manga[] = []
  for (const item of raw) {
    const manga = migrateItem(item)
    if (!manga) continue
    if (seen.has(manga.id)) manga.id = createId()
    seen.add(manga.id)
    out.push(manga)
  }
  return out
}

export function loadList(): Manga[] {
  try {
    const rawText = window.localStorage.getItem(STORAGE_KEY)
    if (!rawText) return []
    return migrateList(JSON.parse(rawText))
  } catch {
    // 깨진 JSON이거나 localStorage 를 못 쓰는 환경(시크릿 모드 등)
    return []
  }
}

export function saveList(list: Manga[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 용량 초과 등 — 저장 실패해도 앱은 계속 동작한다.
  }
}
