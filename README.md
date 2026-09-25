# My Comic Log

읽은 만화를 기록하고 평가하는 개인용 웹앱. 모바일 세로 화면 기준이고, 서버 없이
브라우저 `localStorage` 에만 저장한다.

```bash
npm install
npm run dev        # 개발 서버
npm run typecheck  # 타입 체크
npm run build      # 프로덕션 빌드 (+ 서비스 워커 생성)
npm run preview    # 빌드 결과 확인
```

## 설치형 앱(PWA)

배포 주소: **https://jg5549701-hash.github.io/-/**

`main` 또는 `claude/my-comic-log-app-fx2cvv` 에 푸시하면 GitHub Actions 가
빌드 결과(`dist`)만 담은 단일 커밋으로 `gh-pages` 브랜치를 덮어쓴다
(`.github/workflows/deploy.yml`). `vite.config.ts` 의 `base: './'` 덕분에
하위 경로(`/-/`)에서도 그대로 동작한다.

Pages 의 "GitHub Actions" 소스는 쓰지 않는다 — 워크플로 토큰에는 Pages
사이트를 만들 권한이 없어 공개 저장소에서도 403 이 나고, 저장소 이름이
`-` 라 Settings 의 Pages 화면도 열리지 않기 때문이다. `gh-pages` 브랜치를
푸시하면 Pages 가 자동으로 켜진다.

- **데스크톱** — 크롬/엣지에서 주소창 오른쪽의 설치 아이콘, 또는 메뉴 →
  캐스트·저장 및 공유 → 페이지를 앱으로 설치
- **안드로이드** — 크롬 메뉴 → 앱 설치
- **아이폰** — 사파리 공유 → 홈 화면에 추가

`public/manifest.webmanifest` 가 앱 이름·아이콘·독립 창(standalone)을 정의하고,
`scripts/build-sw.mjs` 가 빌드 결과를 훑어 서비스 워커(`dist/sw.js`)를 만든다.
앱 파일은 캐시 우선, 구글 폰트는 stale-while-revalidate 로 캐시하므로 비행기
모드에서도 열리고 기록도 남길 수 있다. 표지 검색 API 만 네트워크가 필요하다.

기록은 주소(origin)마다 따로 저장된다. 배포 주소가 바뀌면 이전 주소의 기록은
따라오지 않는다.

## 저장 구조

localStorage 키는 `my-manga-list-v1`.

```ts
interface Manga {
  id: string
  title: string          // 필수
  author: string
  genres: string[]
  cover: string          // 이미지 URL
  rating: number         // 수동 전체 평점 (0~5, 0.5 단위)
  ratingAuto: boolean    // true면 항목별 평균을 전체 평점으로 사용 (기본값)
  scores: { art?: number; story?: number; character?: number; direction?: number }
  review: string
  totalEpisodes?: number // 전체 화수. 모르거나 연재 중이면 없음
  readEpisodes: number   // 내가 읽은 화수 (0이면 아직 시작 전)
  createdAt: number      // epoch ms
}
```

`src/lib/storage.ts` 의 `migrateItem()` 이 읽을 때마다 스키마를 보정한다. 필드가
없거나 타입이 다르면 기본값을 채우고(문자열 장르 → 배열, 문자열 평점 → 숫자,
문자열 화수 → 0 이상의 정수, ISO 날짜 문자열 → epoch ms), 살릴 수 없는 항목만
버린다. 그래서 나중에 필드를 추가해도 예전에 저장된 기록이 깨지지 않는다 —
화수 필드는 나중에 추가됐지만 그 전에 저장된 기록도 그대로 열린다.

## 읽은 화수

전체 화수는 선택이다(연재 중이면 비워 둔다). 전체 화수를 알면 카드·상세에
진행 막대가 그려지고 `45 / 120화` 로, 모르면 `45화까지 읽음` 으로 보여준다.
다 읽으면 막대가 검게 차고 **완독** 배지가 붙는다. 상세 다이얼로그의 `+1화` ·
`완독` 버튼으로 목록을 열지 않고 바로 진행을 올릴 수 있다.
관련 계산은 `src/lib/episodes.ts` 에 모여 있다.

## 구조

목록 데이터는 **앱 전체에서 하나의 소스**로만 관리한다.

- `src/context/MangaProvider.tsx` — 최상단 Provider. localStorage 를 읽고 쓰는
  유일한 곳이다. 로딩이 끝나기 전(`ready === false`)에는 절대 write 하지 않아,
  빈 배열이 저장돼 기존 기록이 날아가는 일이 없다.
- `src/context/manga-context.ts` — `useManga()` 훅. 모든 화면이 같은
  `list / add / update / remove / ready` 를 쓴다. 화면마다 localStorage 를 따로
  읽는 훅을 두면 화면 간 데이터가 어긋나고 낡은 목록이 최신 목록을 덮어쓰므로
  절대 하지 않는다.

```
src/
  App.tsx                  탭 셸 (상단 탭 3개 + 스와이프 + 다이얼로그)
  types.ts                 Manga / Scores / 장르 목록
  context/                 MangaProvider, useManga
  lib/
    storage.ts             localStorage 읽기·쓰기 + 마이그레이션
    rating.ts              0.5 단위 스냅, 항목 평균, 전체 평점 계산
    coverSearch.ts         Google Books + Jikan 표지 검색
    useNow.ts              시간 기준선이 움직이는 랭킹·통계용 현재 시각
  components/              Stars, ScoreField, Dialog, 카드, 상세/입력 폼, UI 조각
  tabs/                    ComicsTab, RankingTab, StatsTab
```

## 화면

- **만화** — 카드 그리드, 제목·작가 검색, 장르 칩 필터(여러 개 선택 시 하나라도
  포함), 정렬 4종, 우하단 추가 버튼. 카드를 탭하면 상세 다이얼로그.
- **랭킹** — 전체 평점 기준. 기간 칩(일주일·한달·1년·GOAT), 기본 1~5위에
  "자세히" 로 펼치기. GOAT 은 기간 무관, 전체 평점이 정확히 5.0인 작품만.
  동점이면 최근 기록이 위로.
- **통계** — 요약 카드, 항목별 평균, 장르별 통계, 최근 12개월 기록 수, 작가
  상위 3명. 차트는 외부 라이브러리 없이 div 와 CSS 로만 그린다.

좌우 스와이프와 화살표 버튼으로 탭을 넘긴다. 가로 스크롤되는 칩 영역에서는
스와이프해도 탭이 넘어가지 않는다(`overscroll-behavior-x: contain`,
`touch-action: pan-x`, 터치 이벤트 전파 차단, `data-no-swipe` 확인).

## 별점 입력

별 5개 / 0.5 단위 10단계. 별의 왼쪽 절반과 오른쪽 절반이 각각 버튼이라 마우스와
터치가 똑같이 동작하고, 반쪽 별은 `clip-path` 로 정확히 절반만 채워진다. 옆의
숫자 입력칸은 `inputMode="decimal"` 이고 0~5 범위를 벗어나면 잘라내며, 입력
도중("4." 같은 상태)에는 로컬 텍스트를 쓰다가 blur 에서 0.5 단위로 정리한다.

항목별 점수 4개는 모두 선택 사항이다. 전체 평점은 입력된 항목의 평균을 쓰는
자동 계산이 기본이고, "직접 입력" 으로 바꾸면 수동 지정할 수 있다. 자동 평균은
0.5 단위로 반올림하지 않는다 — 4.5/5/5/5 가 5.0 으로 올라가 GOAT 랭킹에 잘못
끼는 걸 막기 위해서다.

## 표지 자동 검색

제목 입력이 멈춘 뒤 600ms 에 API 키 없이 호출할 수 있는 두 소스를 훑는다.

1. Google Books — `imageLinks.thumbnail` (`zoom` 을 올리고 `http` 는 `https` 로)
2. Jikan — `images.jpg.large_image_url`

두 결과를 합쳐 후보 목록을 만들고 첫 결과를 자동으로 채운다. 후보 썸네일을
탭하면 교체된다. 사용자가 URL 을 직접 고치거나 후보를 고른 뒤에는 자동 검색이
덮어쓰지 않으며, "표지 다시 찾기" 로 언제든 수동 재검색할 수 있다. 검색 실패나
네트워크 오류는 조용히 넘어가고 URL 직접 입력으로 대체한다 — 한국 웹툰처럼 어느
쪽에도 없는 작품도 저장은 정상 동작한다.
