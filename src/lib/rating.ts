import { SCORE_KEYS, type Manga, type Scores } from '../types'

export const MIN_SCORE = 0
export const MAX_SCORE = 5
export const SCORE_STEP = 0.5

/** 0~5 범위로 자른다. (0.5 단위 스냅은 하지 않는다) */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return MIN_SCORE
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, value))
}

/** 0~5 범위로 자르고 0.5 단위로 맞춘다. */
export function snapScore(value: number): number {
  const clamped = clampScore(value)
  return Math.round(clamped / SCORE_STEP) * SCORE_STEP
}

/** 항목별 점수 중 실제로 입력된 것만 모은다. */
export function filledScores(scores: Scores): number[] {
  return SCORE_KEYS.map((key) => scores[key]).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  )
}

/**
 * 항목별 점수의 평균. 입력된 점수가 하나도 없으면 null.
 * (0.5 단위로 스냅하지 않는다 — 4.5/5/5/5 가 5.0 으로 반올림되어
 *  GOAT 랭킹에 잘못 올라가는 걸 막기 위해서다.)
 */
export function autoAverage(scores: Scores): number | null {
  const values = filledScores(scores)
  if (values.length === 0) return null
  const sum = values.reduce((acc, value) => acc + value, 0)
  return clampScore(sum / values.length)
}

/** 화면과 랭킹/통계에서 쓰는 "전체 평점". */
export function overallRating(manga: Manga): number {
  if (manga.ratingAuto) return autoAverage(manga.scores) ?? 0
  return clampScore(manga.rating)
}

/** 전체 평점이 실제로 매겨졌는지 (자동인데 항목 점수가 하나도 없으면 false) */
export function hasRating(manga: Manga): boolean {
  if (manga.ratingAuto) return autoAverage(manga.scores) !== null
  return manga.rating > 0
}

/** 4 -> "4.0", 4.375 -> "4.4" */
export function formatScore(value: number): string {
  return value.toFixed(1)
}
