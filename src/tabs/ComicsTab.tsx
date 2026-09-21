import { useMemo, useState } from 'react'
import { GENRES, type Manga } from '../types'
import { useManga } from '../context/manga-context'
import { overallRating } from '../lib/rating'
import { Chip, EmptyState, HScroll } from '../components/ui'
import { MangaCard } from '../components/MangaCard'

const SORTS = [
  { key: 'recent', label: '최신순' },
  { key: 'high', label: '평점 높은순' },
  { key: 'low', label: '평점 낮은순' },
  { key: 'title', label: '제목순' },
] as const

type SortKey = (typeof SORTS)[number]['key']

function sortList(list: Manga[], sort: SortKey): Manga[] {
  const sorted = [...list]
  switch (sort) {
    case 'high':
      return sorted.sort(
        (a, b) => overallRating(b) - overallRating(a) || b.createdAt - a.createdAt,
      )
    case 'low':
      return sorted.sort(
        (a, b) => overallRating(a) - overallRating(b) || b.createdAt - a.createdAt,
      )
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    case 'recent':
    default:
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
  }
}

export function ComicsTab({ onSelect }: { onSelect: (manga: Manga) => void }) {
  const { list } = useManga()
  const [query, setQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('recent')

  // 기본 장르 목록 + 기록에만 남아 있는 장르(예전 기록)도 함께 보여준다.
  const genreOptions = useMemo(() => {
    const extra = new Set<string>()
    for (const manga of list) {
      for (const genre of manga.genres) {
        if (!GENRES.includes(genre as (typeof GENRES)[number])) extra.add(genre)
      }
    }
    return [...GENRES, ...[...extra].sort((a, b) => a.localeCompare(b, 'ko'))]
  }, [list])

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const filtered = list.filter((manga) => {
      const matchesKeyword =
        !keyword ||
        manga.title.toLowerCase().includes(keyword) ||
        manga.author.toLowerCase().includes(keyword)
      // 여러 개 선택 시 "하나라도 포함"하면 통과
      const matchesGenre =
        selectedGenres.length === 0 || manga.genres.some((genre) => selectedGenres.includes(genre))
      return matchesKeyword && matchesGenre
    })
    return sortList(filtered, sort)
  }, [list, query, selectedGenres, sort])

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    )
  }

  const hasFilter = query.trim() !== '' || selectedGenres.length > 0

  return (
    <div className="pb-28">
      <div className="px-4 pt-4">
        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 · 작가 검색"
            aria-label="제목 또는 작가 검색"
            className="ink-border ink-shadow-sm w-full bg-paper py-2.5 pr-10 pl-3 text-base outline-none focus:bg-accent-soft"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-2 -translate-y-1/2 px-1 text-lg font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <HScroll className="mt-3 px-4 py-1" ariaLabel="장르 필터">
        <Chip active={selectedGenres.length === 0} onClick={() => setSelectedGenres([])}>
          전체
        </Chip>
        {genreOptions.map((genre) => (
          <Chip key={genre} active={selectedGenres.includes(genre)} onClick={() => toggleGenre(genre)}>
            {genre}
          </Chip>
        ))}
      </HScroll>

      <div className="mt-2 flex items-center gap-2 px-4">
        <span className="text-xs font-bold text-ink-soft">{visible.length}편</span>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedGenres([])
              setQuery('')
            }}
            className="border-2 border-ink px-2 py-0.5 text-[11px] font-bold"
          >
            필터 전체 해제
          </button>
        )}
        <div className="ml-auto">
          <label className="sr-only" htmlFor="sort-select">
            정렬
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="ink-border bg-paper px-2 py-1 text-xs font-bold outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        list.length === 0 ? (
          <EmptyState
            title="아직 기록이 없어요"
            description="오른쪽 아래 + 버튼으로 첫 만화를 기록해 보세요."
          />
        ) : (
          <EmptyState title="조건에 맞는 작품이 없어요" description="검색어나 장르 필터를 바꿔 보세요." />
        )
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          {visible.map((manga) => (
            <MangaCard key={manga.id} manga={manga} onClick={() => onSelect(manga)} />
          ))}
        </div>
      )}
    </div>
  )
}
