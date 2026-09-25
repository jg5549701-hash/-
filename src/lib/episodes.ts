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

/**
 * 완독 여부. 화수에서 추측하지 않고 사용자가 체크한 값만 본다.
 * (전체 화수를 몰라도 완독으로 표시할 수 있어야 하기 때문이다)
 */
export function isFinished(manga: Manga): boolean {
  return manga.finishedReading
}

/**
 * 마지막 화까지 읽었는데 아직 완독 체크를 안 한 상태.
 * 자동으로 체크해 버리지 않고, "완독으로 표시" 버튼을 띄우는 데 쓴다.
 */
export function readAllButUnmarked(manga: Manga): boolean {
  return (
    !manga.finishedReading &&
    hasTotal(manga) &&
    manga.readEpisodes >= (manga.totalEpisodes as number)
  )
}

/** "45 / 120화" · "45화까지 읽음" · "" (아직 안 읽음) */
export function formatProgress(manga: Manga): string {
  if (hasTotal(manga)) return `${manga.readEpisodes} / ${manga.totalEpisodes}화`
  if (manga.readEpisodes > 0) return `${manga.readEpisodes}화까지 읽음`
  return ''
}
