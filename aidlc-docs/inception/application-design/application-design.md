# Application Design (통합본)

**작성일**: 2026-08-03
**Depth**: Standard
**대상**: 프론트엔드 F5 고도화 (`requirements.md` 2026-08-03 개정판)

개별 문서: [components.md](components.md) · [component-methods.md](component-methods.md) ·
[services.md](services.md) · [component-dependency.md](component-dependency.md)

---

## 1. 설계 요약

### 한 문장 요약
**Community Dragon 게이트웨이를 신설해 백엔드 정적 데이터 경로를 교체하고, 프론트엔드는 이미 준비된 계약을 그대로 활용한다.**

### 핵심 설계 판단

| # | 판단 | 근거 |
|---|---|---|
| 1 | **프론트엔드 데이터 계약을 바꾸지 않는다** | `types/domain.ts` 가 `Champion.traits`·`Item.recipe`·`iconUrl` 을 이미 정확히 정의. PRD §7 의 "타입 계약 선정의" 자산을 활용 |
| 2 | **Gateway 계층을 새로 만든다** (`cdragon.py`) | `riot_live.py` 가 HTTP·캐시·변환을 겸하다 416줄이 된 전철을 피한다 (DQ1-B) |
| 3 | **DDragon 미러를 완전히 제거한다** | 미러에 특성·조합법이 없어 폴백 가치가 없다. 부수 효과로 수백 MB 클론 불필요 (DQ3-A) |
| 4 | **백엔드가 `iconUrl` 을 완성해 반환한다** | 프론트 컴포넌트가 이미 `iconUrl` 을 소비. 프론트 무변경으로 아이콘이 살아난다 (DQ4-A) |
| 5 | **디스크 캐시를 둔다** | 25MB 페이로드. `--reload` 재시작마다 재다운로드하는 것을 막는다 (DQ2-B, R-6) |

### 설계 착수 전 실측 검증 (A-1 재발 방지)

| 검증 항목 | 결과 |
|---|---|
| CDragon Set 17 챔피언 | 73개, 그중 **63개가 특성 보유** |
| 특성 이름 형식 | **이미 한글** — 매핑 레이어 불필요 |
| 아이템 조합법 | **318개가 `composition` 보유** |
| 에셋 URL 변환 규칙 | 4개 패턴 전부 **HTTP 200** 확인 |
| `squareIcon` vs `tileIcon` | `squareIcon` 은 스플래시 아트, **`tileIcon` 이 정사각 아이콘** |

---

## 2. 컴포넌트 (요약)

### 신규 (3)
| ID | 컴포넌트 | 책임 |
|---|---|---|
| C-1 | `backend/app/services/cdragon.py` | CDragon 페치 · 3단 캐시 · 에셋 URL 변환 |
| C-2 | `frontend/src/components/charts/` | `ChartContainer`, `PlacementChart` |
| C-3 | `frontend/src/components/feedback/DataNotCollected.tsx` | "데이터 수집 전" 안내 + 수집 명령 제시 |

### 변경 (6)
| ID | 컴포넌트 | 유형 |
|---|---|---|
| C-4 | `backend/app/services/static_data.py` | **MAJOR** — 데이터 소스 전면 교체 |
| C-5 | `backend/app/main.py` | MINOR — `supportedFilters` 추가 |
| C-6 | `pages/ChampionDetailPage.tsx` | MINOR — EmptyState → 실내용 |
| C-7 | `pages/{Statistics,Comps,CompDetail}Page.tsx` | MINOR — `DataNotCollected` 적용 |
| C-8 | `pages/SummonerPage.tsx` | MINOR — 차트 + 요약 지표 |
| C-9 | `components/common/SearchBar.tsx` | MINOR — Riot ID 파싱 |

### 변경 없음 (명시적 설계 결정)
`types/domain.ts` · `api/*` · `hooks/*` · **`ChampionsPage`** · **`ItemsPage`** ·
`components/domain/*` · `QueryBoundary` · `riot_live.py` · `dataset.py` · `pipeline/**`

> **`ChampionsPage`·`ItemsPage` 가 변경 없음인 이유**: 특성 필터(`ChampionsPage:30-41`)와
> 아이템 분류 탭·조합법 Modal(`ItemsPage:35-39`, `:80-97`)이 **이미 완전히 구현되어 있다.**
> 데이터가 오는 순간 코드 수정 없이 동작한다.

---

## 3. 서비스 계층

```
Routing      main.py
                ↓
Domain       static_data.py    dataset.py    riot_live.py
                ↓
Gateway      cdragon.py  ← [신규 계층]
                ↓
External     Community Dragon / data/cache/
```

**단방향 의존, 순환 없음.** 실패는 Gateway 에서 흡수되어 상위 계층은 빈 목록을 정상 값으로 취급한다.

### 캐시 3단 구조 (DQ2-B)

| 단계 | 히트 시 지연 | 비고 |
|---|---|---|
| 메모리 | 즉시 | 프로세스 수명 |
| 디스크 (`data/cache/cdragon_setN.json`) | 수십 ms | 수백 KB, `--reload` 재시작에 강함 |
| 원격 (25MB) | 다운로드 시간 | 최초 1회 |
| 전부 실패 | 즉시 | 빈 구조 반환, 500 아님 |

---

## 4. 데이터 흐름

```
CDragon ko_kr.json (25MB)
  → _extract()            현재 세트 필드만 (수백 KB)
  → 디스크 + 메모리 캐시
  → _to_champion / _to_item / _to_trait   도메인 변환
  → asset_url()           iconUrl 부착
  → JSON 응답
  → 프론트 기존 컴포넌트가 그대로 렌더 (무변경)
```

### 필드 매핑 핵심

| 도메인 | CDragon | 주의 |
|---|---|---|
| `Champion.traits` | `traits[]` | 이미 한글 |
| `Champion.iconUrl` | **`tileIcon`** | `squareIcon` 아님 |
| `Item.type` | `composition` 유무 | 있으면 `combined` |
| `Item.recipe` | `composition[]` | 재료 apiName |

**에셋 URL 규칙**: `https://raw.communitydragon.org/latest/game/` + `경로.lower()`, `.tex`/`.dds` → `.png`

---

## 5. 유닛 매핑 (Units Generation 입력)

| Unit | 컴포넌트 | 의존 | Functional Design |
|---|---|---|---|
| **U1** 백엔드 데이터 소스 | C-1, C-4, C-5 | — | EXECUTE |
| **U2** 챔피언·아이템 화면 | C-6 (+ 2개 페이지 동작 확인) | U1 | EXECUTE |
| **U3** 빈 상태 UX | C-3, C-7 | (C-5 일부) | SKIP |
| **U4** 차트 | C-2, C-8 | — | SKIP |
| **U5** 아이콘·UI 정리 | C-9, 아이콘 검증, `gold`→`brand` | U1 | SKIP |

**임계 경로**: U1 → U2. **병행 가능**: U3, U4.

---

## 6. 설계 검증

### 완전성

- [x] 모든 FR 이 컴포넌트에 매핑됨 (FR-1.1', FR-2, FR-3, FR-4, FR-5, FR-6, FR-7)
- [x] 모든 신규/변경 컴포넌트에 책임과 인터페이스 정의
- [x] 의존 관계 명시, 순환 없음 확인
- [x] 실패 경로 정의 (graceful degradation 유지)
- [x] 유닛 분해와 의존 순서 확정

### 일관성

- [x] 기존 아키텍처 패턴 준수 — 서비스 계층 분리, `lru_cache`, graceful degradation
- [x] 기존 프론트 패턴 준수 — `QueryBoundary`, React Query, Tailwind 토큰 (NFR-4)
- [x] 프론트 계약 불변 → NFR-6(목 모드 회귀 방지) 자동 충족
- [x] 범위 밖 컴포넌트 미접촉 확인 (`riot_live.py`, `dataset.py`, `pipeline/`)

### 미결 사항 (Units Generation / Functional Design 에서 확정)

| # | 항목 | 결정 시점 |
|---|---|---|
| 1 | 특성 목록 노출 방식 — `/api/traits` 전용 엔드포인트 vs 챔피언 응답 임베드 | Units Generation |
| 2 | `summarize()` 위치 — `SummonerPage` 로컬 vs `lib/format.ts` 승격 | U4 Code Generation |
| 3 | 챔피언 상세에 표시할 지표 범위 (CDragon `stats` 활용 여부) | U2 Functional Design |
| 4 | 세트 번호 기본값과 `.env.example` 문서화 형식 | U1 Functional Design |

### 알려진 기술 부채 (의도적 미해결)

| 항목 | 사유 |
|---|---|
| `riot_live.py` 의 특성 매핑이 `cdragon.py` 와 중복 (TD-7) | `riot_live.py` 수정은 범위 밖 |
| `static_data.py` 의 `lru_cache` (TD-3 유사) | 정적 게임 데이터는 프로세스 수명 내 불변으로 취급해도 안전. **판단 근거를 코드 주석에 남긴다** |
| `frontend/dist/` 가 git 추적됨 (TD-24) | 범위 밖. 별도 제안 |
