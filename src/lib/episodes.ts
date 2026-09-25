import type { Manga } from '../types'

/** 화수로 인정하는 최대값. 오타로 들어온 터무니없는 값을 막는다. */
export const MAX_EPISODES = 99999

/** 0 이상의 정수로 보정한다. 화수로 볼 수 없으면 undefined. */
export function toEpisodeCount(value: unknown): number | undefined {
  const num = typeof value === 'string' ? Number(value.trim()) : value
  if (typeof num !== 'number' || !Number.isFinite(num)) return undefined
  const rounded = Math.floor(num)
  if (rounded < 0) return undefined
  return Math.min(MAX_EPISODES, rounded)
}

/** 전체 화수를 아는가 */
export function hasTotal(manga: Manga): boolean {
  return typeof manga.totalEpisodes === 'number' && manga.totalEpisodes > 0
}

/** 0~1 사이 진행률. 전체 화수를 모르면 null. */
export function progressRatio(manga: Manga): number | null {
  if (!hasTotal(manga)) return null
  const total = manga.totalEpisodes as number
  return Math.min(1, Math.max(0, manga.readEpisodes / total))
}

/** 전체 화수를 알고, 거기까지 다 읽었는가 */
export function isFinished(manga: Manga): boolean {
  return hasTotal(manga) && manga.readEpisodes >= (manga.totalEpisodes as number)
}

/** "45 / 120화" · "45화까지 읽음" · "" (아직 안 읽음) */
export function formatProgress(manga: Manga): string {
  if (hasTotal(manga)) return `${manga.readEpisodes} / ${manga.totalEpisodes}화`
  if (manga.readEpisodes > 0) return `${manga.readEpisodes}화까지 읽음`
  return ''
}
