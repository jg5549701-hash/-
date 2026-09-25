import { SCORE_KEYS, SCORE_LABELS, type Manga } from '../types'
import { formatScore, hasRating, overallRating } from '../lib/rating'
import { formatProgress, isFinished, progressRatio } from '../lib/episodes'
import { Cover, GenreTag, ProgressBar, StatusBadge } from './ui'
import { StarDisplay } from './Stars'

/** "작화 4.5 · 스토리 5.0" — 입력된 항목만 보여준다. */
function scoreSummary(manga: Manga): string {
  return SCORE_KEYS.filter((key) => typeof manga.scores[key] === 'number')
    .map((key) => `${SCORE_LABELS[key]} ${formatScore(manga.scores[key] as number)}`)
    .join(' · ')
}

export function MangaCard({ manga, onClick }: { manga: Manga; onClick: () => void }) {
  const overall = overallRating(manga)
  const rated = hasRating(manga)
  const summary = scoreSummary(manga)
  const ratio = progressRatio(manga)
  const progress = formatProgress(manga)
  const done = isFinished(manga)

  return (
    <button
      type="button"
      onClick={onClick}
      className="ink-border press ink-shadow flex flex-col bg-paper p-2 text-left"
    >
      <Cover src={manga.cover} title={manga.title} className="aspect-[2/3] w-full" />
      <h3 className="font-display mt-2 line-clamp-2 text-sm leading-tight break-keep">
        {manga.title || '제목 없음'}
      </h3>
      <p className="mt-0.5 truncate text-[11px] text-ink-soft">{manga.author || '작가 미상'}</p>
      {manga.genres.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {manga.genres.slice(0, 3).map((genre) => (
            <GenreTag key={genre}>{genre}</GenreTag>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center gap-1.5 pt-2">
        <span className="font-display text-2xl leading-none tabular-nums">
          {rated ? formatScore(overall) : '-'}
        </span>
        <StarDisplay value={overall} sizeClass="h-3 w-3" />
      </div>
      <p className="mt-1 truncate text-[10px] font-bold text-ink-soft">
        {summary || '항목 점수 없음'}
      </p>
      {(progress || done || manga.seriesCompleted) && (
        <div className="mt-1.5">
          {ratio !== null && <ProgressBar ratio={ratio} heightClass="h-1.5" done={done} />}
          <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-bold">
            {manga.seriesCompleted && <StatusBadge tone="accent">완결</StatusBadge>}
            {done && <StatusBadge tone="ink">완독</StatusBadge>}
            <span className="truncate tabular-nums">{progress}</span>
          </p>
        </div>
      )}
    </button>
  )
}
