import { useMemo, useState } from 'react'
import type { Manga } from '../types'
import { useManga } from '../context/manga-context'
import { formatScore, hasRating, overallRating } from '../lib/rating'
import { useNow } from '../lib/useNow'
import { Chip, Cover, EmptyState, GenreTag, HScroll } from '../components/ui'
import { StarDisplay } from '../components/Stars'

const DAY_MS = 24 * 60 * 60 * 1000

const PERIODS = [
  { key: 'week', label: '일주일', days: 7, empty: '최근 일주일 동안 기록한 작품이 없어요' },
  { key: 'month', label: '한달', days: 30, empty: '최근 한 달 동안 기록한 작품이 없어요' },
  { key: 'year', label: '1년', days: 365, empty: '최근 1년 동안 기록한 작품이 없어요' },
  { key: 'goat', label: 'GOAT', days: null, empty: '아직 5.0점을 준 작품이 없어요' },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']

const TOP_COUNT = 5

function isPerfect(manga: Manga): boolean {
  return hasRating(manga) && Math.abs(overallRating(manga) - 5) < 1e-9
}

function RankRow({ manga, rank, onClick }: { manga: Manga; rank: number; onClick: () => void }) {
  const overall = overallRating(manga)
  const medal = rank <= 3
  return (
    <button
      type="button"
      onClick={onClick}
      className="ink-border press ink-shadow-sm flex w-full items-center gap-3 bg-paper p-2 text-left"
    >
      <span
        className={`font-display w-8 shrink-0 text-center text-2xl leading-none tabular-nums ${
          medal ? 'text-accent' : 'text-ink-soft'
        }`}
      >
        {rank}
      </span>
      <Cover src={manga.cover} title={manga.title} className="h-16 w-11 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-sm leading-tight">
          {manga.title || '제목 없음'}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
          {manga.author || '작가 미상'}
        </span>
        {manga.genres.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {manga.genres.slice(0, 2).map((genre) => (
              <GenreTag key={genre}>{genre}</GenreTag>
            ))}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="font-display block text-xl leading-none tabular-nums">
          {hasRating(manga) ? formatScore(overall) : '-'}
        </span>
        <StarDisplay value={overall} sizeClass="h-3 w-3" />
      </span>
    </button>
  )
}

export function RankingTab({ onSelect }: { onSelect: (manga: Manga) => void }) {
  const { list } = useManga()
  const now = useNow()
  const [period, setPeriod] = useState<PeriodKey>('week')
  const [expanded, setExpanded] = useState(false)

  const current = PERIODS.find((item) => item.key === period) ?? PERIODS[0]

  const ranked = useMemo(() => {
    const filtered =
      current.days === null
        ? list.filter(isPerfect)
        : list.filter((manga) => now - manga.createdAt <= current.days * DAY_MS)
    // 전체 평점 내림차순, 동점이면 최근 기록이 위로.
    return [...filtered].sort(
      (a, b) => overallRating(b) - overallRating(a) || b.createdAt - a.createdAt,
    )
  }, [list, current, now])

  const shown = expanded ? ranked : ranked.slice(0, TOP_COUNT)
  const canExpand = ranked.length > TOP_COUNT

  return (
    <div className="pb-24">
      <HScroll className="px-4 pt-4 pb-1" ariaLabel="기간 선택">
        {PERIODS.map((item) => (
          <Chip
            key={item.key}
            active={period === item.key}
            onClick={() => {
              setPeriod(item.key)
              setExpanded(false)
            }}
          >
            {item.label}
          </Chip>
        ))}
      </HScroll>

      <div className="mt-3 flex items-baseline justify-between gap-2 px-4">
        <h2 className="font-display text-lg">
          {current.key === 'goat' ? '역대 최고 (5.0)' : `${current.label} 랭킹`}
        </h2>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-sm font-bold text-accent underline underline-offset-2"
          >
            {expanded ? '접기' : '자세히'}
          </button>
        )}
      </div>

      {ranked.length === 0 ? (
        <EmptyState title={current.empty} description="만화 탭에서 기록을 남기면 여기에 순위가 생겨요." />
      ) : (
        <div className="mt-3 space-y-2 px-4">
          {shown.map((manga, index) => (
            <RankRow
              key={manga.id}
              manga={manga}
              rank={index + 1}
              onClick={() => onSelect(manga)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
