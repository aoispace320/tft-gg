# Code Quality Assessment

## Test Coverage

| 영역 | 상태 | 비고 |
|------|------|------|
| **Overall** | **Poor** | 소스 ~2,900줄(frontend) + ~730줄(backend)에 대해 테스트 파일 1개 |
| Unit Tests (frontend) | 거의 없음 | `TierBadge.test.tsx` 10줄 하나. 40개 컴포넌트 중 1개 커버 |
| Unit Tests (backend) | **없음** | `dataset.py` 의 조합 그룹핑·티어 매핑, `riot_live.py` 의 `split_riot_id`·`format_tier` 등 순수 함수는 테스트하기 쉬운데도 미작성 |
| Unit Tests (pipeline) | **없음** | |
| Integration Tests | **없음** | 프론트-백엔드 계약 검증 수단 없음 |
| E2E Tests | **없음** | |
| 테스트 인프라 | 구축됨 | Vitest + RTL + jsdom + `test/setup.ts` 준비 완료 — **쓰이지 않고 있을 뿐** |

## Code Quality Indicators

| 항목 | 상태 | 근거 |
|------|------|------|
| **Linting** | **미구성** | ESLint · Prettier · ruff · black 어느 것도 없음. `npm run typecheck` 가 유일한 자동 검사 |
| **Code Style** | **Good (일관적)** | 수동 관리임에도 프론트는 컴포넌트 구조·명명·Tailwind 사용이 일관적. 백엔드도 모듈별 역할 분리가 명확 |
| **Documentation** | **Good** | 백엔드·파이프라인 모듈에 목적과 배경을 설명하는 한국어 docstring 이 충실. `pipeline/README.md`, `frontend/README.md`, `docs/PRD.md` 존재. 특히 `riot_live.py` 는 원본 프로토타입과의 관계와 변경 이유까지 기록 |
| **Type Safety** | **Good (frontend) / N/A (backend)** | 프론트는 `types/domain.ts` 로 도메인 타입 중앙화. 백엔드는 Pydantic 응답 모델 없이 `dict` 반환 → 계약이 런타임에만 존재 |
| **Error Handling** | **Good** | `RiotError(status, message)` → `HTTPException` 변환, 사용자 친화 한국어 메시지. 데이터 부재 시 500 대신 빈 응답 폴백 |
| **Logging** | **Poor** | 구조적 로깅 없음. pipeline 만 `print()` 사용. 백엔드는 로그 자체가 없어 운영 시 장애 추적 불가 |

## Technical Debt

### 🔴 높음

| # | 항목 | 위치 | 영향 |
|---|------|------|------|
| TD-1 | **pandas 가 requirements 에 없음** | `backend/requirements.txt` | 깨끗한 환경에서 `/api/statistics`·`/api/comps` 가 `ImportError` 로 500 |
| TD-2 | **`data/` 디렉토리 자체가 없음** | 워크스페이스 | `/api/champions`·`/api/items`·`/api/comps` → 빈 배열, `/api/statistics` → "수집 데이터 없음". 현재 `frontend/.env` 가 `VITE_USE_MOCK=false` 라 **실행하면 화면 대부분이 비어 보인다** |
| TD-3 | **`lru_cache` 로 CSV 갱신 반영 불가** | `dataset.py:52,79,139` | 파이프라인이 CSV 를 새로 만들어도 서버 재시작 전까지 반영 안 됨. 모듈 주석의 "서버 재시작 불필요" 와 정면으로 모순 |
| TD-4 | **문서-구현 불일치 3건** | 루트 `README.md` | ① PostgreSQL 명시 ↔ DB 코드 전무 ② "Double Up mode 플랫폼" ↔ 파이프라인은 더블업 기본 제외·PRD 는 일반 랭크 기준 ③ "ML: scikit-learn 조합 클러스터링" ↔ `ml/` 은 빈 디렉토리 |

### 🟡 중간

| # | 항목 | 위치 | 영향 |
|---|------|------|------|
| TD-5 | **API 계약이 코드로 강제되지 않음** | backend 전체 | 백엔드가 `dict` 를 그대로 반환. 프론트 `types/domain.ts` 와의 불일치(아래 표)를 컴파일러가 못 잡는다 |
| TD-6 | **조합 명명 규칙 중복 구현** | `dataset.py::_compute_comps` / `riot_live.py::_comp_name` | 규칙 변경 시 한쪽만 고치면 전적검색과 통계의 조합명이 어긋남 |
| TD-7 | **DDragon 접근 로직 중복** | `pipeline/collector/ddragon.py` / `riot_live.py::_trait_name_map` | 동일 목적의 별도 구현 2벌 |
| TD-8 | **`riot_live.py` 416줄 비대화** | `backend/services/riot_live.py` | 라우팅 상수 · HTTP · 캐시 · 도메인 변환 · 응답 조립이 한 파일에 혼재 |
| TD-9 | **전역 가변 상태** | `riot_live.py` `_ddragon_version`, `_trait_names`, `_cache` | `_cache` 에만 락이 있고 나머지 2개는 락 없이 지연 초기화 (uvicorn 멀티스레드에서 경합 가능) |
| TD-10 | **하드코딩된 패치 목록** | `StatisticsPage.tsx:13-17` | `14.11~14.13` 고정. 실제 데이터는 Set 17 인데 UI 는 옛 패치를 보여준다 |
| TD-11 | **`/api/statistics` 가 `patch`·`tier` 파라미터를 무시** | `main.py:53` | UI 필터를 조작해도 결과가 바뀌지 않는다 (사용자에게는 버그로 보임) |
| TD-12 | **린터 부재** | 전 패키지 | 코드 스타일이 사람 손에만 의존 |
| TD-13 | **`docker-compose.yml` 0바이트** | 루트 | 배포 수단 없음. 존재 자체가 오해를 부름 |
| TD-14 | **한글 슬러그 ID** | `dataset.py::_slug` → `Comp.id` | `/comps/빙하-총잡이` 형태 URL. 인코딩 처리에 취약 |
| TD-22 | **`gold` 토큰이 실제로는 파란색** | `tailwind.config.js:18-21` | 2026-07-25 리스킨 때 클래스명을 유지한 채 값만 교체. `text-gold` 가 `#5383E8` 를 칠한다. 동일 값의 `brand` 토큰이 추가됐으나 기존 33개 파일은 여전히 `gold` 사용 → 신규 작업자가 오독하기 쉽다 |
| TD-23 | **PRD 가 현재 구현과 불일치** | `docs/PRD.md` §3, §9-2 | §3 컬러 토큰 전부(딥 틸+골드)와 §9-2 "`/` → `/statistics` 리다이렉트" 결정이 뒤집혔다. 개편 근거는 `docs/260725_UI_개편_설명서.md` 에 있으나 **PRD 본문은 갱신되지 않아** 두 문서가 상충한다 |
| TD-24 | **빌드 산출물이 git 에 커밋됨** | `frontend/dist/` | `.gitignore` 에 없어 dist 가 추적된다. 소스 변경 없이 dist 만 바뀌는 커밋이 실제로 존재해 소스-빌드 일치를 신뢰할 수 없다. 머지 충돌 유발 요인이기도 하다 |

### 🟢 낮음

| # | 항목 | 위치 |
|---|------|------|
| TD-15 | DDragon 버전이 3곳에서 따로 관리 (`frontend/.env` / `DDRAGON_VERSION` env / `_DDRAGON_FALLBACK` 상수) |
| TD-16 | `.env.example` 과 실제 `.env` 의 DDragon 버전 불일치 (14.24.1 vs 16.14.1) |
| TD-17 | Python 의존성 버전 전부 미고정 |
| TD-18 | 백엔드 CORS `allow_origins=["*"]` (개발용으로는 무해) |
| TD-19 | `leaderboard.winRate` 가 `wins/(wins+losses)` 인데 주석은 Top4율이라 함 — 라벨-의미 불일치 |
| TD-20 | 페이지 크기 20 고정, 프론트에서 조절 불가 |
| TD-21 | `ml/` 빈 스캐폴딩 방치 |

## 프론트엔드 미완성 영역 (PRD 대비)

PRD §8 마일스톤 기준 진행도:

| 단계 | 범위 | 상태 |
|------|------|------|
| **F1 — 스캐폴딩** | Vite · 라우터 · NavBar · 디자인 토큰 | ✅ 완료 |
| **F2 — 디자인 시스템** | 공용 컴포넌트 라이브러리 | ✅ 완료 (common 9 + feedback 5 + domain 9) |
| **F3 — 스켈레톤 UI** | 7탭 레이아웃 + 목 데이터 + 상태 처리 | ✅ 완료. 이후 2026-07-25 UI 개편으로 op.gg 풍 테마 + HomePage 신설 (PRD 범위 밖의 추가 작업) |
| **F4 — API 연동** | 목 → 실 API 전환 | 🟡 **부분** — 배선은 전부 완료(6개 훅 모두 실 API 경로 존재)했으나, 백엔드 데이터 부재로 4개 엔드포인트가 빈 값. 실질 동작은 전적검색·랭킹 2개뿐 |
| **F5 — 고도화** | 차트 · 상세 페이지 · 필터 확장 | ❌ 미착수 |

### F5 로 미뤄진 채 EmptyState 로 남아 있는 화면

| 위치 | 표시 문구 |
|------|-----------|
| `ChampionDetailPage.tsx:62-68` | "상세 통계 준비 중 — 평균등수·3성 확률·추천 아이템·시너지 유닛 통계는 F5 단계에서" |
| `CompDetailPage.tsx:57-63` | "상세 가이드 준비 중 — 배치·아이템 우선순위·증강체 추천·ML 클러스터 기반 자동 메타는 F5 단계에서" |
| `StatisticsPage.tsx:98-100` | "픽률·평균등수 차트는 F5 단계에서 Recharts 로 연동 예정" |
| `ArenaPage.tsx:46-63` | 스크린샷 3칸이 점선 플레이스홀더. "결투장 전용 통계 준비 중" |

### 팀이 스스로 남긴 잔여 작업 (`docs/260725_UI_개편_설명서.md` §8)

- [ ] `gold` → `brand` 클래스명 점진적 정리 (TD-22)
- [ ] 통계 차트 Recharts 연동 (StatisticsPage F5 항목)
- [ ] 소환사 검색 Riot ID(`이름#태그`) 형식 파싱 지원
  - **참고**: 백엔드 `riot_live.split_riot_id()` 는 이미 태그 분리·생략 처리를 지원한다. 프론트 입력단만 남았다
- [ ] 유닛/증강체 실제 아이콘 이미지 연결 (현재 폴백 텍스트)

### 데이터가 있어도 채워지지 않는 UI

| UI | 원인 |
|----|------|
| `ChampionsPage` 특성 필터 · `ChampionDetailPage` 특성 표시 | `/api/champions` 의 `traits` 가 항상 `[]` (DDragon 챔피언 데이터에 특성 연결 없음) |
| `ItemsPage` '조합/기본 재료' 분류 탭 | `/api/items` 가 전부 `type: "combined"`, `recipe` 없음 |
| `StatisticsPage` 증강체 TOP5 | `topAugments` 항상 `[]` (Set 17 매치에 `augments` 필드 없음) |
| `StatCard` 변동률(▲▼) | 백엔드가 `delta` 미제공 |
| `MatchRow` 대표 유닛 | 백엔드가 `Match.units` 미제공 |

## Patterns and Anti-patterns

### Good Patterns
- **Mock Fallback** — 백엔드 없이 UI 선행 개발 가능. 단일 스위치(`USE_MOCK`)로 전환, 컴포넌트 무변경
- **QueryBoundary** — Loading/Error/Empty 분기를 한 컴포넌트로 통일. 12개 페이지가 동일 패턴 준수
- **Graceful Degradation** — 데이터 파일이 없어도 500 대신 빈 응답. 프론트가 자연스럽게 EmptyState 표시
- **Service Layer 분리** — `main.py` 는 라우팅만, 데이터 소스별로 서비스 모듈 분리
- **도메인 타입 중앙화** — `types/domain.ts` 단일 파일이 API 계약 역할
- **의도가 기록된 docstring** — 특히 `riot_live.py` 는 "원본 CLI 를 왜 어떻게 함수로 쪼갰는지"까지 남겨 유지보수자가 배경을 안다
- **레이트리밋 방어** — TTL 캐시 + 429 재시도 + 페이지에 보이는 인원만 이름 역조회

### Anti-patterns
- **캐시로 인한 스테일 데이터** — `lru_cache` 가 CSV 갱신을 막는다 (TD-3)
- **로직 중복 2벌** — 조합 명명, DDragon 디코딩 (TD-6, TD-7)
- **God module** — `riot_live.py` 416줄 (TD-8)
- **락 없는 전역 지연 초기화** — `_ddragon_version`, `_trait_names` (TD-9)
- **문자열 경로 규약으로만 이어진 패키지 결합** — backend ↔ pipeline 이 `data/` 하드코딩 경로로만 연결 (TD-7)
- **선언만 되고 안 쓰이는 타입** — `RankTier` 유니온이 정의돼 있으나 실제로는 자유 문자열 `tier` 사용
- **거짓 신호를 주는 빈 파일** — 0바이트 `docker-compose.yml`, `.gitkeep` 만 있는 `ml/`

## 종합 평가

| 축 | 평가 |
|----|------|
| 구조 · 설계 | **양호.** 관심사 분리와 폴백 전략이 잘 잡혀 있다. 프론트는 PRD 를 충실히 따랐다 |
| 문서화 | **양호.** README 3종 + PRD + 충실한 docstring |
| 테스트 | **미흡.** 인프라만 있고 실제 테스트가 사실상 없다 |
| 자동화 | **미흡.** 린터 · CI · 배포 수단 전무 |
| 실행 가능성 | **제약 있음.** 데이터 파일 부재 + pandas 미선언 때문에 현 상태로 clone 후 바로 띄우면 6개 중 2개 기능만 동작하며, 그 2개도 유효한 Riot 키가 있어야 한다 |
