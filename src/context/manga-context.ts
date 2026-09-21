import { createContext, useContext } from 'react'
import type { Manga, MangaDraft } from '../types'

export interface MangaContextValue {
  /** 앱 전체가 공유하는 단 하나의 만화 목록 */
  list: Manga[]
  /** localStorage 로딩이 끝났는지. false 동안에는 절대 write 하지 않는다. */
  ready: boolean
  add: (draft: MangaDraft) => Manga
  update: (id: string, patch: Partial<MangaDraft>) => void
  remove: (id: string) => void
}

export const MangaContext = createContext<MangaContextValue | null>(null)

/**
 * 모든 화면은 이 훅으로만 목록에 접근한다.
 * 화면마다 localStorage 를 따로 읽으면 화면 간 데이터가 어긋나고
 * 낡은 목록이 최신 목록을 덮어쓰게 되므로 절대 하지 않는다.
 */
export function useManga(): MangaContextValue {
  const value = useContext(MangaContext)
  if (!value) {
    throw new Error('useManga()는 <MangaProvider> 안에서만 쓸 수 있습니다.')
  }
  return value
}
