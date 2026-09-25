export const SCORE_KEYS = ['art', 'story', 'character', 'direction'] as const

export type ScoreKey = (typeof SCORE_KEYS)[number]

export const SCORE_LABELS: Record<ScoreKey, string> = {
  art: '작화',
  story: '스토리',
  character: '캐릭터',
  direction: '연출',
}

export type Scores = Partial<Record<ScoreKey, number>>

export interface Manga {
  id: string
  title: string
  author: string
  genres: string[]
  cover: string
  /** 수동 전체 평점 (0~5, 0.5 단위) */
  rating: number
  /** true면 항목별 점수 평균을 전체 평점으로 사용 */
  ratingAuto: boolean
  scores: Scores
  review: string
  /** 전체 화수. 모르거나 연재 중이면 undefined */
  totalEpisodes?: number
  /** 내가 읽은 화수 (0이면 아직 시작 전) */
  readEpisodes: number
  /** 작품 연재가 끝났는가 (완결) */
  seriesCompleted: boolean
  /** 내가 끝까지 다 읽었는가 (완독) */
  finishedReading: boolean
  /** epoch ms */
  createdAt: number
}

/** 새 항목을 만들 때 쓰는 입력 형태 (id/createdAt 제외) */
export type MangaDraft = Omit<Manga, 'id' | 'createdAt'>

export const GENRES = [
  '로맨스',
  '판타지',
  '액션',
  '일상',
  '코미디',
  '스릴러',
  '미스터리',
  '공포',
  '드라마',
  '스포츠',
  '학원',
  '무협',
  'SF',
  '성장',
  '로맨스판타지',
  '개그',
] as const
