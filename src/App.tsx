import { useMemo, useRef, useState, type TouchEvent } from 'react'
import { MangaProvider } from './context/MangaProvider'
import { useManga } from './context/manga-context'
import type { Manga, MangaDraft } from './types'
import { ComicsTab } from './tabs/ComicsTab'
import { RankingTab } from './tabs/RankingTab'
import { StatsTab } from './tabs/StatsTab'
import { MangaDetail } from './components/MangaDetail'
import { MangaForm } from './components/MangaForm'

const TABS = [
  { key: 'comics', label: '만화', sub: 'COMICS' },
  { key: 'ranking', label: '랭킹', sub: 'RANKING' },
  { key: 'stats', label: '통계', sub: 'STATS' },
] as const

/** 스와이프로 인정할 최소 가로 이동량(px) */
const SWIPE_THRESHOLD = 60

function Shell() {
  const { list, ready, add, update, remove } = useManga()

  const [tabIndex, setTabIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Manga | null>(null)

  const touchRef = useRef<{ x: number; y: number; blocked: boolean } | null>(null)

  // 목록에서 다시 찾아오므로 수정 직후에도 최신 내용이 보인다.
  const selected = useMemo(
    () => list.find((manga) => manga.id === selectedId) ?? null,
    [list, selectedId],
  )

  const dialogOpen = formOpen || selected !== null

  const goTo = (next: number) => {
    const clamped = Math.min(TABS.length - 1, Math.max(0, next))
    if (clamped === tabIndex) return
    setDirection(clamped > tabIndex ? 'right' : 'left')
    setTabIndex(clamped)
    window.scrollTo({ top: 0 })
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (dialogOpen || event.touches.length !== 1) {
      touchRef.current = null
      return
    }
    const touch = event.touches[0]
    const target = event.target as HTMLElement | null
    // 가로 스크롤 칩 영역·입력 요소에서 시작한 터치는 탭을 넘기지 않는다.
    const blocked = Boolean(target?.closest?.('[data-no-swipe], input, textarea, select'))
    touchRef.current = { x: touch.clientX, y: touch.clientY, blocked }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchRef.current
    touchRef.current = null
    if (!start || start.blocked || dialogOpen) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // 세로 스크롤과 헷갈리지 않게 가로 이동이 확실할 때만 넘긴다.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.4) return
    goTo(dx < 0 ? tabIndex + 1 : tabIndex - 1)
  }

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleSubmit = (draft: MangaDraft) => {
    if (editing) {
      update(editing.id, draft)
      setSelectedId(editing.id)
    } else {
      add(draft)
    }
    setFormOpen(false)
    setEditing(null)
  }

  const activeTab = TABS[tabIndex]

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <header className="sticky top-0 z-30 border-b-4 border-ink bg-paper">
        <div className="flex items-center justify-between gap-2 bg-ink px-4 py-2.5">
          <h1 className="font-display text-lg tracking-tight text-paper">
            MY COMIC <span className="text-accent">LOG</span>
          </h1>
          <span className="text-[10px] font-bold text-paper/70">{list.length} RECORDS</span>
        </div>
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => goTo(tabIndex - 1)}
            disabled={tabIndex === 0}
            aria-label="이전 탭"
            className="w-9 shrink-0 border-r-2 border-ink text-lg font-bold disabled:opacity-25"
          >
            ‹
          </button>
          <div className="flex min-w-0 flex-1" role="tablist" aria-label="화면 전환">
            {TABS.map((tab, index) => {
              const active = index === tabIndex
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTo(index)}
                  className={`min-w-0 flex-1 border-r-2 border-ink px-1 py-2 last:border-r-0 ${
                    active ? 'bg-accent text-white' : 'bg-paper text-ink'
                  }`}
                >
                  <span className="font-display block text-sm leading-none">{tab.label}</span>
                  <span className="mt-1 block text-[9px] leading-none font-bold opacity-70">
                    {tab.sub}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => goTo(tabIndex + 1)}
            disabled={tabIndex === TABS.length - 1}
            aria-label="다음 탭"
            className="w-9 shrink-0 border-l-2 border-ink text-lg font-bold disabled:opacity-25"
          >
            ›
          </button>
        </div>
      </header>

      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchRef.current = null
        }}
      >
        {!ready ? (
          <p className="py-20 text-center text-sm font-bold text-ink-soft">불러오는 중…</p>
        ) : (
          <div
            key={activeTab.key}
            role="tabpanel"
            className={direction === 'right' ? 'anim-from-right' : 'anim-from-left'}
          >
            {tabIndex === 0 && <ComicsTab onSelect={(manga) => setSelectedId(manga.id)} />}
            {tabIndex === 1 && <RankingTab onSelect={(manga) => setSelectedId(manga.id)} />}
            {tabIndex === 2 && <StatsTab />}
          </div>
        )}
      </main>

      {tabIndex === 0 && ready && (
        <button
          type="button"
          onClick={openAdd}
          aria-label="만화 추가"
          className="ink-border press ink-shadow-lg fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center bg-accent text-3xl leading-none font-bold text-white"
        >
          +
        </button>
      )}

      <MangaDetail
        manga={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(manga) => {
          setSelectedId(null)
          setEditing(manga)
          setFormOpen(true)
        }}
        onDelete={(id) => {
          remove(id)
          setSelectedId(null)
        }}
        onReadEpisodesChange={(id, readEpisodes) => update(id, { readEpisodes })}
      />

      {formOpen && (
        <MangaForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <MangaProvider>
      <Shell />
    </MangaProvider>
  )
}
