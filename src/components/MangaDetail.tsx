import { useState } from 'react'
import { SCORE_KEYS, SCORE_LABELS, type Manga } from '../types'
import { autoAverage, formatScore, hasRating, overallRating } from '../lib/rating'
import { formatProgress, hasTotal, isFinished, progressRatio, toEpisodeCount } from '../lib/episodes'
import { Bar, Cover, DoneBadge, GenreTag, ProgressBar } from './ui'
import { StarDisplay } from './Stars'
import { Dialog } from './Dialog'

export function MangaDetail({
  manga,
  ...handlers
}: {
  manga: Manga | null
  onClose: () => void
  onEdit: (manga: Manga) => void
  onDelete: (id: string) => void
  onReadEpisodesChange: (id: string, readEpisodes: number) => void
}) {
  if (!manga) return null
  // key 를 걸어 다른 작품을 열면 삭제 확인 상태가 알아서 초기화된다.
  return <DetailBody key={manga.id} manga={manga} {...handlers} />
}

function DetailBody({
  manga,
  onClose,
  onEdit,
  onDelete,
  onReadEpisodesChange,
}: {
  manga: Manga
  onClose: () => void
  onEdit: (manga: Manga) => void
  onDelete: (id: string) => void
  onReadEpisodesChange: (id: string, readEpisodes: number) => void
}) {
  const [confirming, setConfirming] = useState(false)

  const overall = overallRating(manga)
  const rated = hasRating(manga)
  const auto = autoAverage(manga.scores)
  const created = new Date(manga.createdAt)
  const ratio = progressRatio(manga)
  const progress = formatProgress(manga)
  const done = isFinished(manga)

  return (
    <Dialog
      open
      onClose={onClose}
      title={manga.title || '제목 없음'}
      footer={
        confirming ? (
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm font-bold">정말 삭제할까요?</span>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="ink-border press ink-shadow-sm bg-paper px-3 py-2 text-sm font-bold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onDelete(manga.id)}
              className="ink-border press ink-shadow-sm bg-accent px-3 py-2 text-sm font-bold text-white"
            >
              삭제
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="ink-border press ink-shadow-sm bg-paper px-4 py-2.5 text-sm font-bold"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={() => onEdit(manga)}
              className="ink-border press ink-shadow-sm flex-1 bg-ink py-2.5 text-sm font-bold text-paper"
            >
              수정하기
            </button>
          </div>
        )
      }
    >
      <div className="flex gap-3">
        <Cover src={manga.cover} title={manga.title} className="h-40 w-28 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight break-keep">{manga.title || '제목 없음'}</h3>
          <p className="mt-1 text-sm text-ink-soft">{manga.author || '작가 미상'}</p>
          {manga.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {manga.genres.map((genre) => (
                <GenreTag key={genre}>{genre}</GenreTag>
              ))}
            </div>
          )}
          <div className="ink-border mt-3 flex items-center gap-2 bg-paper-2 px-2 py-1.5">
            <span className="font-display text-2xl leading-none tabular-nums">
              {rated ? formatScore(overall) : '-'}
            </span>
            <StarDisplay value={overall} sizeClass="h-4 w-4" />
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            {manga.ratingAuto ? '항목 평균 자동 계산' : '직접 입력한 평점'}
          </p>
        </div>
      </div>

      <section className="mt-5">
        <h4 className="font-display mb-2 text-base">읽은 화수</h4>
        <div className="ink-border bg-paper-2 p-3">
          {ratio !== null && <ProgressBar ratio={ratio} heightClass="h-3" done={done} />}
          <div className="mt-2 flex items-center gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              {done && <DoneBadge />}
              <span className="truncate text-sm font-bold tabular-nums">
                {progress || '아직 읽기 전이에요.'}
              </span>
            </span>
            <button
              type="button"
              onClick={() =>
                onReadEpisodesChange(manga.id, toEpisodeCount(manga.readEpisodes + 1) ?? 0)
              }
              className="ink-border press ink-shadow-sm shrink-0 bg-paper px-2.5 py-1.5 text-xs font-bold"
            >
              +1화
            </button>
            {hasTotal(manga) && !done && (
              <button
                type="button"
                onClick={() => onReadEpisodesChange(manga.id, manga.totalEpisodes as number)}
                className="ink-border press ink-shadow-sm shrink-0 bg-ink px-2.5 py-1.5 text-xs font-bold text-paper"
              >
                완독
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <h4 className="font-display mb-2 text-base">항목별 점수</h4>
        <div className="ink-border space-y-2 bg-paper-2 p-3">
          {SCORE_KEYS.map((key) => {
            const score = manga.scores[key]
            const missing = typeof score !== 'number'
            return (
              <Bar
                key={key}
                label={SCORE_LABELS[key]}
                value={missing ? 0 : score}
                muted={missing}
                valueText={missing ? '-' : formatScore(score)}
              />
            )
          })}
          <p className="pt-1 text-[11px] text-ink-soft">
            {auto === null ? '입력된 항목 점수가 없어요.' : `항목 평균 ${formatScore(auto)}점`}
          </p>
        </div>
      </section>

      <section className="mt-5">
        <h4 className="font-display mb-2 text-base">감상</h4>
        <div className="ink-border min-h-20 bg-paper p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {manga.review.trim() || <span className="text-ink-soft">아직 남긴 감상이 없어요.</span>}
        </div>
      </section>

      <p className="mt-4 text-[11px] text-ink-soft">
        기록일 {created.getFullYear()}.{String(created.getMonth() + 1).padStart(2, '0')}.
        {String(created.getDate()).padStart(2, '0')}
      </p>
    </Dialog>
  )
}
