# Unit of Work

**작성일**: 2026-08-03
**결정 근거**: `aidlc-docs/inception/plans/unit-of-work-plan.md` (UQ1~UQ5)

---

## 용어

본 프로젝트는 **모놀리식 로컬 개발 구성**이다. 독립 배포 단위(Service)가 존재하지 않으므로,
각 Unit 은 **논리적 작업 단위(Unit of Work)** 이며 기존 패키지 내 모듈을 수정한다.

**코드 조직 전략**: 브라운필드이므로 신규 디렉토리 구조를 정의하지 않는다.
기존 구조(`backend/app/services/`, `frontend/src/components/`, `frontend/src/pages/`)를 그대로 따른다.

---

## 실행 순서 (UQ3-B)

```
U1 → U3 → U4 → U2 → U5
```

의존 순서를 지키되, U1 직후 **U1 과 무관한 프론트 작업(U3·U4)** 을 처리한다.
U2 는 U1 이 실제로 반환하는 값을 확인한 뒤 진행한다.

---

## U1. 백엔드 정적 데이터 소스 교체

| 항목 | 내용 |
|---|---|
| **목적** | DDragon 로컬 미러를 Community Dragon 으로 교체하여 챔피언 특성과 아이템 조합법을 확보한다 |
| **패키지** | `backend/` |
| **선행 의존** | 없음 |
| **Functional Design** | **EXECUTE** |
| **롤백 경계** | `cdragon.py` 삭제 + `static_data.py` 되돌림 → 기존 동작(빈 배열) 복귀 |

### 책임
- Community Dragon 게이트웨이 신설 (페치 · 3단 캐시 · 에셋 URL 변환)
- 챔피언 도메인 변환 — 현재 세트 필터, 비플레이어 유닛 제외, **특성 채우기**, `iconUrl` 생성
- 아이템 도메인 변환 — `composition` 유무로 `component`/`combined` 판정, `recipe` 매핑, `iconUrl` 생성
- DDragon 로컬 미러 경로 완전 제거 (DQ3-A)
- 세트 번호를 환경변수 `TFT_SET` 으로 분리 (DQ5-B)

### 산출물
| 파일 | 유형 |
|---|---|
| `backend/app/services/cdragon.py` | 신규 |
| `backend/app/services/static_data.py` | MAJOR 수정 |
| `backend/requirements.txt` | pandas 추가 (FR-3.4) |
| `.env.example` | `TFT_SET` 문서화 |
| `.gitignore` | `data/cache/` 확인 (`data/` 로 이미 커버) |

### 완료 기준
- `curl localhost:8000/api/champions` → 비어 있지 않은 `traits` 와 `iconUrl` 포함
- `curl localhost:8000/api/items` → `component` 와 `combined` 가 모두 존재, `recipe` 포함
- 네트워크 차단 시 500 이 아닌 빈 목록 반환
- 서버 재시작 시 디스크 캐시로 즉시 응답

---

## U3. 빈 상태 UX 개선

| 항목 | 내용 |
|---|---|
| **목적** | 데이터가 없는 화면을 "의도된 안내"로 바꾼다 |
| **패키지** | `frontend/` + `backend/app/main.py` (한 줄) |
| **선행 의존** | 없음 |
| **Functional Design** | SKIP |
| **롤백 경계** | 프론트 3개 페이지 + `main.py` 되돌림 |

### 책임
- `DataNotCollected` 컴포넌트 신설 — 원인 설명 + 수집 명령 제시 (FR-2.3)
- `StatisticsPage` — `-` 값 카드를 안내로 대체, 하드코딩 패치 드롭다운을 `supportedFilters` 로 제어
- `CompsPage`·`CompDetailPage` — `EmptyState` → `DataNotCollected`
- **`/api/statistics` 에 `supportedFilters` 추가** (UQ2-B 로 U1 에서 이동)

### 산출물
| 파일 | 유형 |
|---|---|
| `frontend/src/components/feedback/DataNotCollected.tsx` | 신규 |
| `frontend/src/pages/StatisticsPage.tsx` | MINOR |
| `frontend/src/pages/CompsPage.tsx` | MINOR |
| `frontend/src/pages/CompDetailPage.tsx` | MINOR |
| `backend/app/main.py` | MINOR |

### 완료 기준
- 통계·전략가 페이지에 `-` 카드와 침묵하는 빈 목록이 사라짐
- 안내에 파이프라인 실행 명령이 포함됨
- 패치·티어 드롭다운이 `supportedFilters` 에 따라 비활성

---

## U4. 차트 도입

| 항목 | 내용 |
|---|---|
| **목적** | Recharts 를 도입하고 실데이터로 동작하는 차트를 만든다 |
| **패키지** | `frontend/` |
| **선행 의존** | 없음 (라이브 Riot 데이터 사용) |
| **Functional Design** | SKIP |
| **롤백 경계** | `charts/` 삭제 + `SummonerPage` 되돌림 + package.json |

### 책임
- Recharts 의존성 추가 (FR-4.1)
- `charts/` 디렉토리 신설 — `ChartContainer`(테마 래퍼), `PlacementChart`(등수 분포)
- `SummonerPage` 에 차트 + 평균 등수 · Top4율 요약 지표 배치 (FR-4.2, FR-4.3)
- `StatisticsPage` 차트는 **컴포넌트만 두고 데이터 연결 유예** (FR-4.5)

### 산출물
| 파일 | 유형 |
|---|---|
| `frontend/src/components/charts/ChartContainer.tsx` | 신규 |
| `frontend/src/components/charts/PlacementChart.tsx` | 신규 |
| `frontend/src/pages/SummonerPage.tsx` | MINOR |
| `frontend/package.json` | Recharts 추가 |

### 완료 기준
- 실제 소환사 검색 시 등수 분포 차트가 렌더됨
- 평균 등수 · Top4율이 표시됨
- 반응형 동작 (NFR-5)
- 매치가 없을 때 차트가 자체 안내를 표시

---

## U2. 챔피언 · 아이템 화면

| 항목 | 내용 |
|---|---|
| **목적** | U1 이 공급한 데이터로 화면이 실제로 동작하는지 확인하고, 미완성 화면을 채운다 |
| **패키지** | `frontend/` |
| **선행 의존** | **U1** |
| **Functional Design** | **EXECUTE** |
| **롤백 경계** | `ChampionDetailPage` 되돌림 |

### 책임
- `ChampionDetailPage` 의 "상세 통계 준비 중" EmptyState 를 실내용으로 교체 (FR-5.1)
- **`ChampionsPage` 특성 필터 동작 확인** — 코드 변경 없음 (FR-5.2)
- **`ItemsPage` 분류 탭 · 조합법 Modal 동작 확인** — 코드 변경 없음 (FR-5.3)

> **이 유닛이 작은 이유**: 특성 필터와 아이템 분류·조합법 UI 는 **이미 구현되어 있다**
> (`ChampionsPage:30-41`, `ItemsPage:35-39`·`:80-97`). U1 이 데이터를 공급하면 코드 수정 없이 동작한다.
> U2 는 **U1 의 결과를 검증하는 관문** 역할이 핵심이다 (UQ5-A).

### 산출물
| 파일 | 유형 |
|---|---|
| `frontend/src/pages/ChampionDetailPage.tsx` | MINOR |

### 완료 기준
- 챔피언 상세에 특성이 표시되고 "준비 중" 문구가 사라짐
- 챔피언 목록의 특성 드롭다운에 실제 특성이 나타나고 필터가 동작
- 아이템 '조합/기본 재료' 탭 카운트가 0 이 아니고, 조합법 Modal 이 재료 아이콘을 표시

---

## U5. 아이콘 검증 · UI 정리

| 항목 | 내용 |
|---|---|
| **목적** | 아이콘 표시를 확인하고 잔여 정리 작업을 마무리한다 |
| **패키지** | `frontend/` |
| **선행 의존** | **U1** (`iconUrl` 생성) |
| **Functional Design** | SKIP |
| **롤백 경계** | 개별 파일 단위 |

### 책임
- 유닛 · 아이템 아이콘 실이미지 표시 확인, `IconImage` 폴백 유지 검증 (FR-6.1, FR-6.2)
- DDragon 버전 참조 일원화 (FR-6.3)
- `SearchBar` Riot ID(`이름#태그`) 파싱 (FR-7.2)
- **이번 작업에서 수정한 파일에 한해** `gold` → `brand` 정리 (FR-7.1)
- **[선택]** `UnitList.tsx` 의 목 데이터 직접 import 제거 (아래 참조)

> **특성 아이콘 제외 (UQ1-C)**: `TraitIcon.tsx` 는 이미지가 아니라 `◆` 글리프 + 이름 텍스트 칩이다.
> 변경 없이 그대로 둔다.

### 산출물
| 파일 | 유형 |
|---|---|
| `frontend/src/components/common/SearchBar.tsx` | MINOR |
| `frontend/src/lib/ddragon.ts` | MINOR (버전 일원화) |
| 수정한 파일들 | `gold` → `brand` |
| `frontend/src/components/domain/UnitList.tsx` | **선택** |

### 완료 기준
- 챔피언 · 아이템 아이콘이 실이미지로 표시되고, 로드 실패 시 이니셜 폴백 동작
- 검색창에 `이름#태그` 입력이 정상 처리됨
- 수정한 파일에 `gold` 클래스가 남아 있지 않음

---

## 계획 수립 중 발견된 기존 결함 (U5 선택 항목)

### `UnitList.tsx` 의 목 데이터 직접 의존

```
frontend/src/components/domain/UnitList.tsx:1
  import { mockChampionsById } from '@/mocks/champions';
```

프로덕션 컴포넌트가 `USE_MOCK` 스위치와 무관하게 **항상 목 데이터에서 챔피언을 조회**한다.
실 API 모드에서도 조합 핵심 유닛이 목 데이터 기준으로 렌더된다.

| 항목 | 판단 |
|---|---|
| **현재 영향** | 없음 — 사용처인 `CompDetailPage` 가 U3 에서 `DataNotCollected` 로 대체되므로 화면에 노출되지 않는다 |
| **올바른 수정** | `useChampions()` 결과를 props 나 context 로 전달받도록 변경 |
| **처리 방침** | U5 **선택 항목**. 시간이 남으면 처리하고, 못 하면 기술부채로 명시해 남긴다 |
| **범위 판단 근거** | 이번 작업의 핵심 목표(F5 고도화)가 아니며, 수정 시 `UnitList` 사용처 전체의 데이터 흐름을 바꿔야 한다 |

---

## 유닛 요약

| Unit | 이름 | 패키지 | 의존 | FD | 신규 | 수정 |
|---|---|---|---|---|---|---|
| **U1** | 백엔드 정적 데이터 소스 교체 | backend | — | ✅ | 1 | 4 |
| **U3** | 빈 상태 UX 개선 | frontend + backend | — | ❌ | 1 | 4 |
| **U4** | 차트 도입 | frontend | — | ❌ | 2 | 2 |
| **U2** | 챔피언 · 아이템 화면 | frontend | U1 | ✅ | 0 | 1 |
| **U5** | 아이콘 검증 · UI 정리 | frontend | U1 | ❌ | 0 | 3+ |

**신규 파일 4개 / 수정 파일 14개 내외.** Git 커밋은 수행하지 않는다 (UQ4-B).
