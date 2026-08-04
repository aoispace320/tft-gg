# Components

**설계 결정 근거**: `aidlc-docs/inception/plans/application-design-plan.md` (DQ1~DQ8)

---

## 1. 신규 컴포넌트

### C-1. `backend/app/services/cdragon.py` — Community Dragon 게이트웨이

**Purpose**: Community Dragon 원본 데이터에 대한 **유일한 접근 지점**. 페치 · 캐싱 · 원본 스키마 노출을 전담한다.

**Responsibilities**
- Community Dragon 전체 JSON(약 25MB)을 HTTP 로 1회 페치
- 현재 세트에 필요한 필드만 추출해 **디스크 캐시**(`data/cache/cdragon_set{N}.json`, 수백 KB)에 보관
- 메모리 캐시로 프로세스 내 재사용
- 원본 에셋 경로(`.tex`/`.dds`)를 실제 이미지 URL 로 변환
- 네트워크·파싱 실패 시 예외를 삼키고 **빈 데이터**를 반환 (graceful degradation 유지)

**Interfaces (제공)**
- 현재 세트의 챔피언 원본 목록
- 현재 세트의 특성 원본 목록
- 아이템 원본 목록
- 에셋 경로 → URL 변환 함수

**Interfaces (소비)**
- `requests` (HTTP)
- 파일시스템 (`data/cache/`)
- 환경변수 `TFT_SET` (DQ5-B)

**설계 근거 (DQ1-B)**: `riot_live.py` 가 416줄로 비대해진 전철을 피한다. 외부 소스 접근과 도메인 변환을 분리해
`static_data.py` 는 조립만 담당하게 한다.

---

### C-2. `frontend/src/components/charts/` — 차트 컴포넌트 모듈 (DQ7-B)

**Purpose**: Recharts 기반 시각화 컴포넌트를 모아 두는 신규 5번째 분류.

**Responsibilities**
- 도메인 데이터를 받아 차트로 렌더
- 반응형 대응 (NFR-5)
- 데이터가 비었을 때의 표현을 자체 처리

**소속 컴포넌트**
| 컴포넌트 | 목적 |
|---|---|
| `PlacementChart` | 최근 매치 등수(1~8) 분포 막대 그래프 — FR-4.2 |
| `ChartContainer` | Recharts `ResponsiveContainer` + 공통 테마(툴팁·축·색상) 래퍼 |

**설계 근거 (DQ7-B)**: 기존 4분류(`layout`/`common`/`feedback`/`domain`) 중 어디에도 자연스럽게 속하지 않는다.
차트가 F5 이후로도 늘어날 것을 전제로 별도 분류를 만든다.

---

### C-3. `frontend/src/components/feedback/DataNotCollected` — 데이터 미수집 안내 (FR-2)

**Purpose**: 파이프라인 미실행으로 데이터가 없는 화면에서 **의도된 안내**를 표시한다.

**Responsibilities**
- 왜 비어 있는지 설명
- 데이터를 채우는 방법(파이프라인 실행 명령)을 제시 — FR-2.3
- 기존 `EmptyState` 와 시각적으로 일관

**설계 근거**: `EmptyState` 는 "조건에 맞는 결과 없음"을, 이 컴포넌트는 "아직 수집 안 됨"을 뜻한다.
두 상태의 의미가 달라 사용자에게 주는 행동 지침도 다르므로 분리한다.

---

## 2. 변경 컴포넌트

### C-4. `backend/app/services/static_data.py` — 정적 데이터 도메인 조립기 **(MAJOR)**

**Purpose (변경 후)**: CDragon 원본을 프론트엔드 계약(`types/domain.ts`)에 맞는 도메인 모델로 변환한다.

**Responsibilities (변경 후)**
- `cdragon.py` 로부터 원본 데이터 수신
- 챔피언: 현재 세트 필터링, Summon/PVE 제외, 비용 1~5 검증, **특성 배열 채우기**, `iconUrl` 생성
- 아이템: 실제 아이템만 선별, **`composition` 유무로 `component`/`combined` 판정**, `recipe` 매핑, `iconUrl` 생성
- 특성: 이름·아이콘 목록 제공 (신규)

**제거되는 책임 (DQ3-A)**
- ❌ `data/TFT_DDragon/` 로컬 미러 읽기 — 완전 제거
- ❌ `_load()` 파일 I/O — `cdragon.py` 가 대체

**Interfaces (제공)**: `champions()`, `items()`, `traits()`
**Interfaces (소비)**: `cdragon.py`

---

### C-5. `backend/app/main.py` — API 라우팅 **(MINOR)**

**변경 내용**
- `/api/statistics` 응답에 `supportedFilters` 필드 추가 (DQ6-A, FR-3.3)
- 필요 시 `/api/traits` 엔드포인트 추가 검토 (Units Generation 에서 확정)

**불변**: CORS 설정, 라이브 Riot 엔드포인트, 에러 변환 규약

---

### C-6. `frontend/src/pages/ChampionDetailPage.tsx` **(MINOR)**

**변경 내용**: "상세 통계 준비 중" `EmptyState`(`:62-68`)를 실제 내용으로 교체 — FR-5.1
**불변**: 프로필 카드 · 특성 표시 영역(이미 `champion.traits` 를 렌더하고 있음)

---

### C-7. `frontend/src/pages/{Statistics,Comps,CompDetail}Page.tsx` **(MINOR)**

**변경 내용**
- `StatisticsPage`: `-` 값 카드 대신 `DataNotCollected` 표시. 하드코딩 패치 드롭다운을 `supportedFilters` 기반으로 제어
- `CompsPage`·`CompDetailPage`: `EmptyState` → `DataNotCollected`

---

### C-8. `frontend/src/pages/SummonerPage.tsx` **(MINOR)**

**변경 내용**: `PlacementChart` 배치 + 평균 등수 · Top4율 요약 지표 — FR-4.2, FR-4.3

---

### C-9. `frontend/src/components/common/SearchBar.tsx` **(MINOR)**

**변경 내용**: Riot ID(`이름#태그`) 입력 파싱 — FR-7.2
**참고**: 백엔드 `split_riot_id()` 가 태그 생략을 이미 지원하므로, 프론트는 입력 검증·안내만 담당

---

## 3. 변경 없는 컴포넌트 (명시적 확인)

이 목록은 **"건드리지 않는다"는 설계 결정**이다.

| 컴포넌트 | 변경 없는 이유 |
|---|---|
| `frontend/src/types/domain.ts` | `Champion.traits`·`Item.type`·`Item.recipe`·`iconUrl` 이 **이미 정확히 정의되어 있다**. 백엔드가 이 형태를 채운다 |
| `frontend/src/api/*.ts` | 엔드포인트·목 폴백 구조가 그대로 유효 |
| `frontend/src/hooks/*.ts` | React Query 래퍼 변경 불필요 |
| `frontend/src/pages/ChampionsPage.tsx` | **특성 필터가 이미 구현되어 있다** (`:30-41`). 데이터만 오면 동작 |
| `frontend/src/pages/ItemsPage.tsx` | **분류 탭과 조합법 Modal 이 이미 구현되어 있다** (`:35-39`, `:80-97`) |
| `frontend/src/components/domain/{ItemIcon,ChampionCard,TraitIcon}.tsx` | 이미 `iconUrl` 을 소비하고 `IconImage` 폴백을 갖는다. 백엔드가 URL 을 채우면 그대로 표시 |
| `frontend/src/components/feedback/QueryBoundary.tsx` | 기존 분기 로직 유효 |
| `backend/app/services/riot_live.py` | 범위 밖 (requirements §5) |
| `backend/app/services/dataset.py` | 범위 밖 (requirements §5) |
| `pipeline/**` | 범위 밖 (Q5-C) |

> **설계 원칙**: 프론트엔드 데이터 계약을 **바꾸지 않는다.** PRD §7 의 "API 타입 계약 선정의" 결정 덕분에
> 백엔드만 맞추면 되는 상태이므로, 이 자산을 그대로 활용한다.

---

## 4. 컴포넌트 배치 요약

```
backend/app/
  services/
    cdragon.py          ← [신규] C-1 CDragon 게이트웨이
    static_data.py      ← [MAJOR] C-4 도메인 조립기
    riot_live.py        ← 변경 없음
    dataset.py          ← 변경 없음
  main.py               ← [MINOR] C-5

frontend/src/
  components/
    charts/             ← [신규] C-2
      ChartContainer.tsx
      PlacementChart.tsx
    feedback/
      DataNotCollected.tsx  ← [신규] C-3
    common/SearchBar.tsx    ← [MINOR] C-9
    domain/*                ← 변경 없음
  pages/
    ChampionDetailPage.tsx  ← [MINOR] C-6
    StatisticsPage.tsx      ← [MINOR] C-7
    CompsPage.tsx           ← [MINOR] C-7
    CompDetailPage.tsx      ← [MINOR] C-7
    SummonerPage.tsx        ← [MINOR] C-8
    ChampionsPage.tsx       ← 변경 없음
    ItemsPage.tsx           ← 변경 없음
  types/domain.ts           ← 변경 없음

data/cache/                 ← [신규] 디스크 캐시 (gitignore 대상)
```
