import { useCallback, useEffect, useRef, useState } from 'react'
import { GENRES, SCORE_KEYS, SCORE_LABELS, type Manga, type MangaDraft, type ScoreKey, type Scores } from '../types'
import { autoAverage, formatScore } from '../lib/rating'
import { searchCovers } from '../lib/coverSearch'
import { Chip, Cover, HScroll } from './ui'
import { ScoreField } from './ScoreField'
import { Dialog } from './Dialog'

const COVER_DEBOUNCE_MS = 600

export function MangaForm({
  initial,
  onClose,
  onSubmit,
}: {
  /** null 이면 새로 추가, 값이 있으면 그 기록을 수정 */
  initial: Manga | null
  onClose: () => void
  onSubmit: (draft: MangaDraft) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [genres, setGenres] = useState<string[]>(initial?.genres ?? [])
  const [cover, setCover] = useState(initial?.cover ?? '')
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [ratingAuto, setRatingAuto] = useState(initial?.ratingAuto ?? true)
  const [scores, setScores] = useState<Scores>(initial?.scores ?? {})
  const [review, setReview] = useState(initial?.review ?? '')
  const [error, setError] = useState('')

  const [candidates, setCandidates] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  /**
   * 사용자가 표지를 직접 고르거나 URL 을 고친 뒤에는 자동 검색이 덮어쓰지 않는다.
   * 이미 표지가 있는 기록을 수정할 때도 처음부터 잠근 상태로 시작한다.
   */
  const [coverLocked, setCoverLocked] = useState(Boolean(initial?.cover))
  const abortRef = useRef<AbortController | null>(null)

  // 폼이 닫히면 진행 중이던 표지 검색은 취소한다.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [])

  const runSearch = useCallback(async (query: string, applyFirst: boolean) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    try {
      const results = await searchCovers(query, controller.signal)
      if (controller.signal.aborted) return
      setCandidates(results)
      if (applyFirst && results[0]) setCover(results[0])
    } catch {
      // 검색 실패·네트워크 오류는 조용히 넘어간다 (URL 직접 입력으로 대체)
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }, [])

  // 제목 입력이 멈춘 뒤 600ms 에 표지를 자동으로 찾는다.
  useEffect(() => {
    if (coverLocked) return
    const query = title.trim()
    const timer = window.setTimeout(() => {
      if (query.length < 2) {
        setCandidates([])
        return
      }
      void runSearch(query, true)
    }, COVER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [title, coverLocked, runSearch])

  const toggleGenre = (genre: string) => {
    setGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const setScore = (key: ScoreKey, value: number | null) => {
    setScores((prev) => {
      const next = { ...prev }
      if (value === null) delete next[key]
      else next[key] = value
      return next
    })
  }

  const autoValue = autoAverage(scores)

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('제목은 꼭 필요해요.')
      return
    }
    onSubmit({
      title: trimmed,
      author: author.trim(),
      genres,
      cover: cover.trim(),
      rating,
      ratingAuto,
      scores,
      review,
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={initial ? '기록 수정' : '만화 추가'}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ink-border press ink-shadow-sm bg-paper px-4 py-2.5 text-sm font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="ink-border press ink-shadow-sm flex-1 bg-accent py-2.5 text-sm font-bold text-white"
          >
            저장
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="form-title">
            제목 <span className="text-accent">*</span>
          </label>
          <input
            id="form-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (error) setError('')
            }}
            placeholder="예) 원피스"
            className="ink-border w-full bg-paper px-3 py-2.5 text-base outline-none focus:bg-accent-soft"
          />
          {error && <p className="mt-1 text-xs font-bold text-accent">{error}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="form-author">
            작가
          </label>
          <input
            id="form-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="예) 오다 에이이치로"
            className="ink-border w-full bg-paper px-3 py-2.5 text-base outline-none focus:bg-accent-soft"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold">장르</span>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Chip key={genre} active={genres.includes(genre)} onClick={() => toggleGenre(genre)}>
                {genre}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-bold">표지</span>
            <div className="flex items-center gap-2">
              {searching && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-ink-soft">
                  <span className="inline-block h-2.5 w-2.5 animate-spin border-2 border-ink border-t-transparent" />
                  찾는 중
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  const query = title.trim()
                  if (!query) {
                    setError('제목을 먼저 입력해 주세요.')
                    return
                  }
                  setCoverLocked(false)
                  void runSearch(query, true)
                }}
                className="border-2 border-ink px-2 py-1 text-[11px] font-bold"
              >
                표지 다시 찾기
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Cover src={cover} title={title} className="h-28 w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <input
                value={cover}
                onChange={(event) => {
                  setCover(event.target.value)
                  setCoverLocked(true)
                }}
                placeholder="이미지 URL"
                inputMode="url"
                className="ink-border w-full bg-paper px-3 py-2 text-sm outline-none focus:bg-accent-soft"
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                제목을 입력하면 자동으로 찾아봐요. 못 찾으면 URL 을 직접 넣어도 돼요.
              </p>
            </div>
          </div>
          {candidates.length > 0 && (
            <HScroll className="mt-2 py-1" ariaLabel="표지 후보">
              {candidates.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setCover(url)
                    setCoverLocked(true)
                  }}
                  className={`h-20 w-14 shrink-0 overflow-hidden border-2 bg-paper-2 ${
                    cover === url ? 'border-accent ring-2 ring-accent' : 'border-ink'
                  }`}
                >
                  <img src={url} alt="표지 후보" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </HScroll>
          )}
        </div>

        <div className="ink-border bg-paper-2 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-display text-base">전체 평점</span>
            <div className="flex overflow-hidden border-2 border-ink">
              <button
                type="button"
                onClick={() => setRatingAuto(true)}
                className={`px-2.5 py-1 text-[11px] font-bold ${ratingAuto ? 'bg-accent text-white' : 'bg-paper'}`}
              >
                자동 계산
              </button>
              <button
                type="button"
                onClick={() => {
                  // 직접 입력으로 바꿀 때 지금 보이던 자동 평균을 출발점으로 쓴다.
                  if (ratingAuto && rating === 0 && autoValue !== null) {
                    setRating(Math.round(autoValue * 2) / 2)
                  }
                  setRatingAuto(false)
                }}
                className={`border-l-2 border-ink px-2.5 py-1 text-[11px] font-bold ${
                  ratingAuto ? 'bg-paper' : 'bg-accent text-white'
                }`}
              >
                직접 입력
              </button>
            </div>
          </div>
          <ScoreField
            label="전체"
            value={ratingAuto ? autoValue : rating}
            disabled={ratingAuto}
            hint={ratingAuto ? '항목별 점수의 평균' : '0~5 · 0.5점 단위'}
            onChange={(next) => setRating(next ?? 0)}
          />
          {ratingAuto && (
            <p className="mt-1.5 text-[11px] text-ink-soft">
              {autoValue === null
                ? '항목별 점수를 넣으면 자동으로 계산돼요.'
                : `항목 평균 ${formatScore(autoValue)}점이 전체 평점이 돼요.`}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <span className="block text-sm font-bold">항목별 점수 (선택)</span>
          {SCORE_KEYS.map((key) => (
            <ScoreField
              key={key}
              label={SCORE_LABELS[key]}
              value={scores[key] ?? null}
              onChange={(next) => setScore(key, next)}
            />
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold" htmlFor="form-review">
            감상
          </label>
          <textarea
            id="form-review"
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={5}
            placeholder="이 작품, 어땠나요?"
            className="ink-border w-full resize-y bg-paper px-3 py-2.5 text-base leading-relaxed outline-none focus:bg-accent-soft"
          />
        </div>
      </div>
    </Dialog>
  )
}
