import { useMemo, type ReactNode } from 'react'
import { SCORE_KEYS, SCORE_LABELS, type Manga, type ScoreKey } from '../types'
import { useManga } from '../context/manga-context'
import { formatScore, hasRating, overallRating } from '../lib/rating'
import { Bar, EmptyState } from '../components/ui'
import { useNow } from '../lib/useNow'

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="ink-border ink-shadow-sm relative overflow-hidden bg-paper p-3">
      <div className="halftone absolute inset-0" aria-hidden="true" />
      <p className="relative text-[11px] font-bold text-ink-soft">{label}</p>
      <p className="font-display relative mt-1 text-2xl leading-none tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-sm">{unit}</span>}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="font-display mb-2 text-lg">{title}</h2>
      <div className="ink-border ink-shadow-sm bg-paper p-3">{children}</div>
    </section>
  )
}

export function StatsTab() {
  const { list } = useManga()
  const nowMs = useNow()

  const stats = useMemo(() => {
    const now = new Date(nowMs)
    const rated = list.filter(hasRating)

    // 항목별 평균 — 점수가 없는 작품은 제외한다.
    const scoreAverages = {} as Record<ScoreKey, number | null>
    for (const key of SCORE_KEYS) {
      const values = list
        .map((manga) => manga.scores[key])
        .filter((value): value is number => typeof value === 'number')
      scoreAverages[key] = average(values)
    }

    // 장르별 기록 수 / 평균 평점
    const genreMap = new Map<string, { count: number; ratings: number[] }>()
    for (const manga of list) {
      for (const genre of manga.genres) {
        const entry = genreMap.get(genre) ?? { count: 0, ratings: [] }
        entry.count += 1
        if (hasRating(manga)) entry.ratings.push(overallRating(manga))
        genreMap.set(genre, entry)
      }
    }
    const genres = [...genreMap.entries()]
      .map(([genre, entry]) => ({ genre, count: entry.count, avg: average(entry.ratings) }))
      .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.count - a.count)

    // 최근 12개월 기록 수
    const months: { label: string; key: string; count: number }[] = []
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      months.push({
        label: `${date.getMonth() + 1}`,
        key: `${date.getFullYear()}-${date.getMonth()}`,
        count: 0,
      })
    }
    const monthIndex = new Map(months.map((month, index) => [month.key, index]))
    for (const manga of list) {
      const date = new Date(manga.createdAt)
      const index = monthIndex.get(`${date.getFullYear()}-${date.getMonth()}`)
      if (index !== undefined) months[index].count += 1
    }

    // 많이 기록한 작가 상위 3명
    const authorMap = new Map<string, number>()
    for (const manga of list) {
      const author = manga.author.trim()
      if (!author) continue
      authorMap.set(author, (authorMap.get(author) ?? 0) + 1)
    }
    const topAuthors = [...authorMap.entries()]
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author, 'ko'))
      .slice(0, 3)

    const thisMonthCount = list.filter((manga: Manga) => {
      const date = new Date(manga.createdAt)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    }).length

    return {
      total: list.length,
      overallAvg: average(rated.map(overallRating)),
      perfectCount: rated.filter((manga) => Math.abs(overallRating(manga) - 5) < 1e-9).length,
      thisMonthCount,
      scoreAverages,
      genres,
      months,
      topAuthors,
      maxMonth: Math.max(1, ...months.map((month) => month.count)),
    }
  }, [list, nowMs])

  if (list.length === 0) {
    return (
      <div className="px-4 pt-4 pb-24">
        <EmptyState
          title="아직 통계를 낼 기록이 없어요"
          description="만화 탭에서 작품을 기록하면 여기에 그래프가 그려져요."
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="총 기록" value={String(stats.total)} unit="편" />
        <SummaryCard
          label="전체 평균 평점"
          value={stats.overallAvg === null ? '-' : formatScore(stats.overallAvg)}
        />
        <SummaryCard label="5.0점 작품" value={String(stats.perfectCount)} unit="편" />
        <SummaryCard label="이번 달 기록" value={String(stats.thisMonthCount)} unit="편" />
      </div>

      <Section title="항목별 평균">
        <div className="space-y-2">
          {SCORE_KEYS.map((key) => {
            const value = stats.scoreAverages[key]
            return (
              <Bar
                key={key}
                label={SCORE_LABELS[key]}
                value={value ?? 0}
                muted={value === null}
                valueText={value === null ? '-' : formatScore(value)}
              />
            )
          })}
        </div>
      </Section>

      <Section title="장르별 통계">
        {stats.genres.length === 0 ? (
          <p className="text-sm text-ink-soft">아직 장르를 넣은 기록이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {stats.genres.map((entry) => (
              <div key={entry.genre} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-xs font-bold">{entry.genre}</span>
                <span className="relative h-5 min-w-0 flex-1 border-2 border-ink bg-paper-2">
                  <span
                    className={`absolute inset-y-0 left-0 ${entry.avg === null ? 'bg-ink-soft' : 'bg-accent'}`}
                    style={{ width: `${((entry.avg ?? 0) / 5) * 100}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] font-bold tabular-nums">
                  {entry.avg === null ? '-' : formatScore(entry.avg)}
                  <span className="text-ink-soft"> · {entry.count}편</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="월별 기록 수">
        <div className="flex h-32 items-end gap-1">
          {stats.months.map((month) => (
            <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold tabular-nums">
                {month.count > 0 ? month.count : ''}
              </span>
              <span
                className={`w-full border-2 border-ink ${month.count > 0 ? 'bg-accent' : 'bg-paper-2'}`}
                style={{
                  height: `${Math.max(4, (month.count / stats.maxMonth) * 88)}px`,
                }}
              />
              <span className="text-[9px] text-ink-soft tabular-nums">{month.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="많이 기록한 작가">
        {stats.topAuthors.length === 0 ? (
          <p className="text-sm text-ink-soft">아직 작가를 넣은 기록이 없어요.</p>
        ) : (
          <ol className="space-y-2">
            {stats.topAuthors.map((entry, index) => (
              <li key={entry.author} className="flex items-center gap-3">
                <span
                  className={`font-display w-6 text-center text-lg leading-none tabular-nums ${
                    index === 0 ? 'text-accent' : 'text-ink-soft'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{entry.author}</span>
                <span className="shrink-0 text-xs font-bold text-ink-soft tabular-nums">
                  {entry.count}편
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  )
}
