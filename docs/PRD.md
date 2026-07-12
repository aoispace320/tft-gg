# 롤토체스 정보 사이트 — 프론트엔드 PRD

> **작성일:** 2026-07-12
> **버전:** v0.2 (프론트엔드 관점)
> **프로젝트 코드명:** tft-gg
> **담당 범위:** Frontend (React + TypeScript)

---

## 1. 개요 (Overview)

롤토체스(Teamfight Tactics) 플레이어를 위한 **전적·통계·메타 정보 웹 서비스**의 프론트엔드.
본 문서는 **프론트엔드 관점**에서 화면 구조, 컴포넌트, 라우팅, 디자인 시스템, 데이터 연동 방식을 정의한다.

1차 릴리스 목표는 **7개 탭의 네비게이션·라우팅·레이아웃·스켈레톤 UI 완성**이며,
백엔드 실데이터는 목(mock) 데이터로 대체해 UI를 선행 구축하고 이후 API에 연결한다.

### 1.1 프론트엔드 목표 (Goals)
- 7개 탭 라우팅 + 글로벌 네비게이션 완성 (에러/깨진 레이아웃 0건)
- LoL 톤(딥 틸 + 골드) 다크 테마 **디자인 토큰·공용 컴포넌트 라이브러리** 확립
- 모든 탭에 **Loading / Empty / Error 상태** 구현 (목 데이터로 렌더)
- 백엔드와의 **API 타입 계약(TypeScript 인터페이스)** 선정의 → 실연동 시 컴포넌트 변경 최소화
- 반응형 (데스크톱/태블릿/모바일)

### 1.2 비목표 (Non-Goals, 1차 제외)
- 백엔드 API 구현 (프론트는 소비자 입장, 목 데이터 사용)
- 로그인/회원/즐겨찾기/알림
- 실시간 소켓, SSR/SEO 최적화
- 다국어(i18n) — 한국어 우선, 구조만 확장 가능하게

---

## 2. 기술 스택 (Frontend)

| 항목 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | React + TypeScript | 저장소 `frontend/` |
| 빌드 도구 | Vite | 빠른 개발 서버·HMR |
| 라우팅 | React Router v6 | 탭 라우팅 |
| 데이터 페칭 | TanStack Query (React Query) | 캐싱·로딩/에러 상태 표준화 |
| HTTP 클라이언트 | Axios (또는 fetch 래퍼) | `src/api/` |
| 스타일링 | Tailwind CSS + 디자인 토큰 | config에 §3 토큰 매핑 |
| 에셋 | Riot Data Dragon CDN | 챔피언/아이템/특성 아이콘 |
| 상태관리 | React Query(서버 상태) + 로컬 useState/Context | 전역 스토어 최소화 |
| 차트 | Recharts (통계 그래프) | 추후 도입 |
| 테스트 | Vitest + React Testing Library | 컴포넌트 단위 |

---

## 3. 디자인 시스템 (Design System)

첨부 LoL 로고 무드 기준 **딥 틸 + 골드** 다크 테마. `src/theme/`에 토큰으로 관리.

### 3.1 컬러 토큰
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-base` | `#0A1428` | 페이지 배경 |
| `--bg-surface` | `#0F2027` | 카드·패널 |
| `--bg-elevated` | `#132B34` | 상단바·모달 |
| `--accent-gold` | `#C8AA6E` | 주요 강조·액션 |
| `--accent-gold-bright` | `#F0E6D2` | 골드 하이라이트 |
| `--accent-teal` | `#0AC8B9` | 링크·그래프·보조 강조 |
| `--text-primary` | `#F0E6D2` | 본문 |
| `--text-muted` | `#A09B8C` | 보조 텍스트 |
| `--border` | `#785A28` | 골드 라인/구분선 |

### 3.2 타이포 / 스페이싱
- 헤드라인: 세리프 계열(Beaufort 대체 — Spectral 등), 본문: 산세리프.
- 스페이싱 스케일: 4px 기준 (4/8/12/16/24/32/48).
- 라운드: 카드 8px, 버튼 6px. 골드 1px 보더 + 은은한 틸 글로우.

### 3.3 티어 색상 (통계/랭킹 공용)
챌린저/그마/마스터/다이아~아이언 티어별 색상, 조합·챔피언 티어리스트 배지(S/A/B/C/D) 색상 토큰 정의.

---

## 4. 정보 구조 & 라우팅 (Routing)

글로벌 `<NavBar>`: 좌측 로고, 중앙 7개 탭, 우측 전적검색 검색바.

| # | 탭 | 라우트 | 페이지 컴포넌트 |
|---|-----|--------|-----------------|
| 1 | 전적검색 | `/search`, `/summoner/:region/:name` | `SearchPage`, `SummonerPage` |
| 2 | 데이터 통계 | `/statistics` | `StatisticsPage` |
| 3 | 아이템 | `/items` | `ItemsPage` |
| 4 | 챔피언 통계 | `/champions`, `/champions/:id` | `ChampionsPage`, `ChampionDetailPage` |
| 5 | 플레이어 순위 | `/leaderboard` | `LeaderboardPage` |
| 6 | 전략가 | `/comps`, `/comps/:id` | `CompsPage`, `CompDetailPage` |
| 7 | 결투장 소개 | `/arena` | `ArenaPage` |
| - | 404 | `*` | `NotFoundPage` |

- 기본 진입(`/`) → `/statistics` 리다이렉트(또는 홈 대시보드, §9 결정).
- 활성 탭 하이라이트(골드 언더라인), 딥링크 지원.

---

## 5. 컴포넌트 아키텍처

```
frontend/src/
  pages/          # 탭별 페이지 컨테이너
    SearchPage.tsx / SummonerPage.tsx
    StatisticsPage.tsx
    ItemsPage.tsx
    ChampionsPage.tsx / ChampionDetailPage.tsx
    LeaderboardPage.tsx
    CompsPage.tsx / CompDetailPage.tsx
    ArenaPage.tsx
  components/
    layout/       # NavBar, Footer, PageHeader, Container
    common/       # Button, Card, Tabs, Table, Modal, Dropdown, Badge, Pagination
    feedback/     # Skeleton, EmptyState, ErrorState, Spinner
    domain/       # ChampionCard, ItemIcon, TraitIcon, AugmentIcon, TierBadge, CompCard, MatchRow
  api/            # 엔드포인트별 클라이언트 + 타입 (아래 §7)
  hooks/          # useSummoner, useLeaderboard 등 React Query 훅
  theme/          # tokens.css, ThemeProvider
  mocks/          # 목 데이터(JSON) — 실연동 전 UI 구동용
  types/          # 공용 도메인 타입
```

### 5.1 공용 컴포넌트 (1차 필수)
- **레이아웃:** `NavBar`, `PageHeader`, `Container`
- **데이터 표시:** `Table`(정렬/페이지네이션), `Card`, `Tabs`, `Badge`, `Dropdown`
- **상태:** `Skeleton`, `EmptyState`("Coming soon"/데이터 없음), `ErrorState`, `Spinner`
- **도메인:** `ChampionCard`, `ItemIcon`, `TierBadge`, `CompCard`, `MatchRow`

---

## 6. 화면별 요구사항 (탭/스켈레톤 우선)

각 페이지는 **[1차: 스켈레톤 UI]** 와 **[추후 확장]** 으로 구분. 1차는 목 데이터로 렌더.

### 6.1 전적검색 `/search`, `/summoner/:region/:name`
- **[1차]** 지역 드롭다운 + 소환사명 입력 + 검색 버튼 / 소환사 프로필 헤더 스켈레톤(닉네임·티어·LP·레벨) / 최근 매치 리스트 스켈레톤(`MatchRow`: 등수·조합·날짜) / Loading·Empty·Error 상태
- **[추후]** 매치 상세(최종 보드·유닛·아이템·증강체), 등수 분포 차트, 평균 등수·Top4율, 모드 필터

### 6.2 데이터 통계 `/statistics`
- **[1차]** 대시보드 레이아웃(증강체/조합/통계 카드 영역) / 패치·티어 필터 UI(`Dropdown`) / 플레이스홀더 카드
- **[추후]** 증강체 픽률·평균등수, 조합 트렌드, 아이템 통계, 차트 연동

### 6.3 아이템 `/items`
- **[1차]** 아이템 그리드(`ItemIcon`) + 분류 탭(조합/기본 재료) / 아이템 상세 `Modal` 스켈레톤(조합법·설명)
- **[추후]** 아이템별 평균등수·사용률, 추천 챔피언, 조합 시뮬레이터

### 6.4 챔피언 통계 `/champions`, `/champions/:id`
- **[1차]** 챔피언 그리드(`ChampionCard`) + 비용/특성 필터 UI / 상세 페이지 스켈레톤
- **[추후]** 평균등수·3성 확률·추천 아이템, 시너지 유닛/특성 통계

### 6.5 플레이어 순위 `/leaderboard`
- **[1차]** 랭킹 `Table` 스켈레톤(순위·소환사·티어·LP·승률) + 지역 탭 + 티어 필터 + `Pagination`
- **[추후]** 실시간 챌/그마 연동, 행 클릭 → 전적검색 상세, 순위 변동 추이

### 6.6 전략가 `/comps`, `/comps/:id`
- **[1차]** 조합 카드 리스트(`CompCard`: 조합명·티어배지·대표 유닛) + 티어 필터
- **[추후]** 조합 상세(배치·아이템 우선순위·증강체·운영 가이드), ML 클러스터 기반 자동 메타

### 6.7 결투장 소개 `/arena`
- **[1차]** 모드 소개 정적 페이지(개요·규칙·스크린샷 섹션 레이아웃)
- **[추후]** 결투장 전용 통계·전적, 이벤트/시즌 공지

---

## 7. API 소비 계약 (Frontend ↔ Backend)

프론트는 소비자. 아래 타입을 `src/api/` + `src/types/`에 **선정의**하고, 1차엔 `src/mocks/`의 목 데이터로 동일 형태 반환.

| 훅 | 엔드포인트 | 반환 타입(요약) |
|----|-----------|-----------------|
| `useSummoner(region, name)` | `GET /api/summoner/{region}/{name}` | `SummonerProfile & { matches: Match[] }` |
| `useStatistics(patch, tier)` | `GET /api/statistics` | `MetaStats` |
| `useItems()` | `GET /api/items` | `Item[]` |
| `useChampions()` | `GET /api/champions` | `Champion[]` |
| `useLeaderboard(region, tier, page)` | `GET /api/leaderboard` | `{ rows: RankRow[]; total: number }` |
| `useComps()` | `GET /api/comps` | `Comp[]` |

```ts
// 예시 타입 (types/domain.ts)
interface SummonerProfile { name: string; region: string; tier: string; lp: number; level: number; }
interface Match { placement: number; comp: string; playedAt: string; }
interface RankRow { rank: number; name: string; tier: string; lp: number; winRate: number; }
interface Champion { id: string; name: string; cost: 1|2|3|4|5; traits: string[]; }
interface Item { id: string; name: string; type: 'component'|'combined'; recipe?: string[]; }
interface Comp { id: string; name: string; tier: 'S'|'A'|'B'|'C'|'D'; coreUnits: string[]; }
```

- **환경변수:** `VITE_API_BASE_URL` — 미설정 시 목 모드로 폴백(`VITE_USE_MOCK=true`).
- React Query 표준: `isLoading` → `Skeleton`, `isError` → `ErrorState`, 빈 배열 → `EmptyState`.

---

## 8. 릴리스 계획 (Frontend Milestones)

| 단계 | 범위 | 산출물 |
|------|------|--------|
| **F1 — 스캐폴딩** | Vite 세팅, 라우터, `NavBar`, 디자인 토큰, ThemeProvider | 7탭 라우팅 동작(빈 페이지) |
| **F2 — 디자인 시스템** | 공용 컴포넌트(Card/Table/Tabs/Skeleton/EmptyState 등) | 컴포넌트 라이브러리 |
| **F3 — 스켈레톤 UI** | 7개 탭 레이아웃 + 목 데이터 렌더 + 상태 처리 | 클릭 가능한 전체 골격 |
| **F4 — API 연동** | 목 → 실 API 전환(전적검색→통계→랭킹 순) | 핵심 기능 실데이터 |
| **F5 — 고도화** | 차트·상세 페이지·필터 확장 | 통계/메타 심화 |

> **본 PRD 1차 범위 = F1 + F2 + F3** (탭 구조 + 디자인 시스템 + 스켈레톤).

---

## 9. 확정된 결정 사항 (Decisions)
1. **스타일링:** ✅ **Tailwind CSS** — `tailwind.config`에 §3 디자인 토큰을 커스텀 컬러로 매핑.
2. **홈(`/`) 진입:** ✅ **`/statistics`로 리다이렉트** — 별도 홈 대시보드 없음.
3. **에셋 소스:** ✅ **Riot Data Dragon CDN** 직접 참조 (챔피언/아이템/특성 아이콘).
4. **게임 모드:** ✅ **일반 랭크** 기준으로 1차 UI 구성 (더블업은 추후 확장).
5. **차트 라이브러리:** Recharts (F5 단계 도입 예정, 확정 대기).

---

## 10. 성공 지표 (Frontend)
- 7개 탭 라우팅·렌더 정상 (레이아웃 깨짐 0건)
- 데스크톱/태블릿/모바일 반응형 유지
- Lighthouse 접근성 90+ / 다크 테마 대비 WCAG AA 통과
- 전적검색 입력 → 결과(목) 렌더 정상 플로우
- 모든 페이지 Loading/Empty/Error 상태 구현

---

*본 문서는 프론트엔드 기준 v0.2. 탭 구조 확정 후 각 페이지 상세 스펙·와이어프레임은 별도 문서로 확장한다.*
