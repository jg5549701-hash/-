import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Manga, MangaDraft } from '../types'
import { createId, loadList, saveList } from '../lib/storage'
import { MangaContext, type MangaContextValue } from './manga-context'

export function MangaProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Manga[]>([])
  const [ready, setReady] = useState(false)

  // 최초 1회만 localStorage 에서 읽어온다.
  useEffect(() => {
    setList(loadList())
    setReady(true)
  }, [])

  // ready 가 false 인 동안에는 write 금지.
  // (로딩 전 빈 배열이 저장돼 기존 기록이 날아가는 걸 막는다)
  useEffect(() => {
    if (!ready) return
    saveList(list)
  }, [list, ready])

  const add = useCallback((draft: MangaDraft): Manga => {
    const manga: Manga = { ...draft, id: createId(), createdAt: Date.now() }
    setList((prev) => [manga, ...prev])
    return manga
  }, [])

  const update = useCallback((id: string, patch: Partial<MangaDraft>) => {
    setList((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = useMemo<MangaContextValue>(
    () => ({ list, ready, add, update, remove }),
    [list, ready, add, update, remove],
  )

  return <MangaContext.Provider value={value}>{children}</MangaContext.Provider>
}
