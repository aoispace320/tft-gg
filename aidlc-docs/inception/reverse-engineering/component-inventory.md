# Component Inventory

## Application Packages

| 패키지 | 목적 | 상태 |
|--------|------|------|
| `frontend/` | React 18 + TypeScript SPA. 8탭 · 12라우트 TFT 정보 서비스 | 구현됨 (PRD F1~F3 완료, F4 부분, F5 미착수) |
| `backend/` | FastAPI API 서버. 6개 GET 엔드포인트 | 구현됨 (데이터 파일 부재로 4개는 빈 응답) |
| `pipeline/` | Riot 매치 수집 + ML 학습용 CSV 전처리 배치 | 구현됨, **미실행** (산출물 없음) |
| `ml/` | 조합 클러스터링 (루트 README 기준) | **미구현 — `.gitkeep` 3개뿐** |

## Infrastructure Packages

없음.
- `docker-compose.yml` 존재하나 **0바이트 빈 파일**
- CDK / Terraform / CloudFormation 없음
- CI/CD 정의 없음

## Shared Packages

별도 공유 패키지 없음. 다만 아래가 사실상 계약 역할을 한다.

| 위치 | 역할 |
|------|------|
| `frontend/src/types/domain.ts` | **프론트-백엔드 API 소비 계약의 단일 원천**. 백엔드에는 대응하는 스키마 정의(Pydantic 모델 등)가 없어 계약이 코드로 강제되지 않는다 |
| `frontend/src/config/{nav,regions}.ts` | 네비게이션 탭 · 지역 상수 |
| `pipeline/collector/ddragon.py` | ID→한글 이름 디코더. backend `riot_live._trait_name_map()` 이 유사 기능을 **별도 구현**하고 있다 |

## Test Packages

전용 테스트 패키지 없음. 소스와 함께 배치된 테스트 파일 1개뿐.

| 파일 | 유형 | 범위 |
|------|------|------|
| `frontend/src/components/domain/TierBadge.test.tsx` (10줄) | Unit (Vitest + RTL) | `TierBadge` 컴포넌트 단일 |
| `frontend/src/test/setup.ts` (1줄) | 설정 | jest-dom 매처 등록 |

백엔드 · 파이프라인 테스트: **0건**.

## Frontend Component Breakdown

### pages (12)
`HomePage` · `SearchPage` · `SummonerPage` · `StatisticsPage` · `ItemsPage` ·
`ChampionsPage` · `ChampionDetailPage` · `LeaderboardPage` · `CompsPage` ·
`CompDetailPage` · `ArenaPage` · `NotFoundPage`

### components/layout (5)
`AppLayout` · `NavBar` · `Footer` · `PageHeader` · `Container`

### components/common (9)
`Table` · `SearchBar` · `Dropdown` · `Modal` · `Pagination` · `Tabs` · `Button` · `Card` · `Badge`

### components/feedback (5)
`QueryBoundary` · `Skeleton` · `ErrorState` · `EmptyState` · `Spinner`

### components/domain (9)
`AugmentIcon` · `IconImage` · `UnitList` · `TierBadge` · `MatchRow` · `ItemIcon` ·
`ChampionCard` · `CompCard` · `TraitIcon`

### hooks (6) / api clients (6+1) / mocks (6)
`useSummoner` · `useLeaderboard` · `useStatistics` · `useChampions` · `useItems` · `useComps`
— 각각 대응하는 `api/*.ts` 클라이언트와 `mocks/*.ts` 목 데이터가 1:1로 존재

### lib / config / theme / types
`lib/{queryClient,ddragon,format}.ts` · `config/{nav,regions}.ts` ·
`theme/tokens.css` · `types/domain.ts`

## Backend Module Breakdown

| 모듈 | 줄수 | 역할 |
|------|------|------|
| `app/main.py` | 89 | FastAPI 앱 · CORS · 라우팅 |
| `app/services/riot_live.py` | 416 | 라이브 Riot API 연동 (최대 모듈) |
| `app/services/dataset.py` | 160 | 전처리 CSV → 통계 · 조합 |
| `app/services/static_data.py` | 62 | DDragon 미러 → 챔피언 · 아이템 |
| `app/cli.py` | - | 프로토타입 CLI 재현 |

## Pipeline Module Breakdown

| 모듈 | 역할 |
|------|------|
| `run.py` | argparse 진입점, 수집 → 전처리 오케스트레이션 |
| `collector/riot_client.py` | Riot API 클라이언트 (레이트리밋 · 429 재시도) |
| `collector/ddragon.py` | DDragon 로더 · ID→한글 디코더 |
| `collector/collect.py` | 상위티어 유저 → 매치 수집 → JSONL |
| `processor/preprocess.py` | 평탄화 · 디코딩 · 멀티핫 → CSV 2종 |

## Total Count

| 구분 | 수 |
|------|-----|
| **Total Packages** | 4 (frontend, backend, pipeline, ml) |
| Application | 3 (frontend, backend, pipeline) |
| Infrastructure | 0 |
| Shared | 0 (별도 패키지 없음) |
| Test | 0 (테스트 파일 1개가 소스에 동거) |
| 미구현 스캐폴딩 | 1 (ml) |

| 소스 파일 통계 | 수 |
|----------------|-----|
| frontend `src/` TS·TSX·CSS 파일 | 71개 / 약 2,906줄 |
| frontend React 컴포넌트 (pages + components) | 40개 |
| backend Python 모듈 | 6개 (`__init__` 2개 포함) / 약 730줄 |
| pipeline Python 모듈 | 8개 (`__init__` 3개 포함) |
| ml Python 모듈 | **0개** |
| 테스트 파일 | **1개** |
