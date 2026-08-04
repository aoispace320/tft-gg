# Component Methods

메서드 시그니처와 입출력 타입을 정의한다.
**상세 비즈니스 규칙(필터 조건, 판정 기준, 엣지 케이스)은 Functional Design(U1·U2)에서 확정한다.**

---

## C-1. `backend/app/services/cdragon.py`

### 공개 메서드

```python
def set_number() -> str:
    """현재 대상 세트 번호. 환경변수 TFT_SET, 미설정 시 기본값. (DQ5-B)"""

def champions_raw() -> list[dict]:
    """현재 세트의 CDragon 원본 챔피언 목록.
    각 항목 키: apiName, characterName, name, cost, traits[], icon, squareIcon, tileIcon, role, stats
    실패 시 [] 반환."""

def traits_raw() -> list[dict]:
    """현재 세트의 CDragon 원본 특성 목록.
    각 항목 키: apiName, name, desc, icon, effects[]
    실패 시 [] 반환."""

def items_raw() -> list[dict]:
    """CDragon 원본 아이템 목록 (전 세트 공통).
    각 항목 키: apiName, name, desc, icon, composition[], associatedTraits[], tags[], unique
    실패 시 [] 반환."""

def asset_url(path: str | None) -> str | None:
    """CDragon 에셋 경로를 실제 이미지 URL 로 변환.

    입력: 'ASSETS/Characters/TFT17_Briar/HUD/TFT17_Briar_Square.tex'
    출력: 'https://raw.communitydragon.org/latest/game/assets/characters/tft17_briar/hud/tft17_briar_square.png'

    규칙 (2026-08-03 HTTP 검증 완료):
      BASE + path.lower() 후 확장자 .tex/.dds → .png
    path 가 None/빈 문자열이면 None 반환."""
```

### 내부 메서드

```python
def _fetch_remote() -> dict:
    """Community Dragon 전체 JSON(약 25MB)을 HTTP GET. 타임아웃·재시도 포함."""

def _extract(payload: dict) -> dict:
    """전체 페이로드에서 현재 세트의 champions/traits + items 만 추출.
    25MB → 수백 KB 로 축소. 디스크 캐시에 저장할 형태."""

def _cache_path() -> str:
    """data/cache/cdragon_set{N}.json 절대 경로."""

def _load_or_fetch() -> dict:
    """캐시 계층 진입점 (DQ2-B).
    ① 메모리 캐시 → ② 디스크 캐시 → ③ 원격 페치 후 양쪽에 저장
    모든 단계 실패 시 빈 구조 {'champions': [], 'traits': [], 'items': []} 반환."""
```

**입출력 계약**
- 모든 공개 메서드는 **예외를 던지지 않는다.** 실패는 빈 목록/`None` 으로 표현 (graceful degradation, NFR)
- 반환값은 CDragon **원본 스키마 그대로**. 도메인 변환은 `static_data.py` 의 책임

---

## C-4. `backend/app/services/static_data.py`

### 공개 메서드 (기존 시그니처 유지)

```python
def champions() -> list[dict]:
    """프론트 Champion[] 계약에 맞는 챔피언 목록.

    반환 항목 형태:
      { "id": str,           # CDragon apiName (예: 'TFT17_Briar')
        "name": str,         # 한글 이름
        "cost": int,         # 1~5
        "traits": list[str], # 한글 특성명 — [변경] 기존에는 항상 []
        "iconUrl": str }     # [신규] tileIcon 기반 정사각 아이콘

    정렬: (cost, name) 오름차순 — 기존 동작 유지"""

def items() -> list[dict]:
    """프론트 Item[] 계약에 맞는 아이템 목록.

    반환 항목 형태:
      { "id": str,
        "name": str,
        "type": "component" | "combined",  # [변경] 기존에는 전부 'combined'
        "recipe": list[str] | None,        # [신규] combined 인 경우 재료 id 2개
        "description": str | None,         # [신규] CDragon desc
        "iconUrl": str }                   # [신규]

    정렬: name 오름차순 — 기존 동작 유지"""
```

### 신규 공개 메서드

```python
def traits() -> list[dict]:
    """특성 목록. 챔피언 상세·특성 아이콘 표시에 사용.

    반환 항목 형태:
      { "id": str,        # apiName (예: 'TFT17_Doomer')
        "name": str,      # 한글 이름
        "iconUrl": str }

    노출 방식(전용 엔드포인트 vs 챔피언 응답 내 임베드)은 Units Generation 에서 확정."""
```

### 내부 변환 메서드

```python
def _to_champion(raw: dict, trait_index: dict[str, str]) -> dict | None:
    """CDragon 챔피언 원본 → 도메인 Champion.
    제외 대상(현재 세트 아님/Summon/PVE/비용 범위 밖)이면 None.
    trait_index: apiName → 한글명 매핑 (CDragon 챔피언의 traits 는 이미 한글이나,
                 표기 정규화가 필요한 경우 대비)"""

def _to_item(raw: dict, name_index: dict[str, str]) -> dict | None:
    """CDragon 아이템 원본 → 도메인 Item.
    composition 유무로 type 판정. 제외 대상이면 None."""

def _to_trait(raw: dict) -> dict:
    """CDragon 특성 원본 → 도메인 Trait."""
```

**제거되는 메서드 (DQ3-A)**

```python
def _load(name: str) -> dict:   # ❌ 삭제 — data/TFT_DDragon/ 로컬 미러 읽기
```

**상수 변경**

| 기존 | 변경 후 |
|---|---|
| `_DD = os.path.join(_ROOT, "data", "TFT_DDragon", "data", "ko_KR")` | ❌ 제거 |
| `_CURRENT_SET_PREFIX = "TFT17_"` | `cdragon.set_number()` 로 이관 (DQ5-B) |

---

## C-5. `backend/app/main.py`

```python
@app.get("/api/statistics")
def statistics(patch: str | None = None, tier: str | None = None):
    """[변경] 응답에 supportedFilters 추가 (DQ6-A, FR-3.3).

    추가 필드:
      "supportedFilters": { "patch": bool, "tier": bool }

    현재는 전처리 데이터가 없어 둘 다 false.
    프론트는 이 값으로 드롭다운 비활성화 여부를 판단한다."""
```

**검토 대상 (Units Generation 에서 확정)**

```python
@app.get("/api/traits")
def traits():
    """특성 목록. 전용 엔드포인트로 둘지, champions 응답에 임베드할지 미결."""
```

---

## C-2. `frontend/src/components/charts/`

```tsx
// ChartContainer.tsx
interface ChartContainerProps {
  children: React.ReactElement;   // Recharts 차트 엘리먼트
  height?: number;                // 기본 240
  className?: string;
}
export function ChartContainer(props: ChartContainerProps): JSX.Element
// ResponsiveContainer 래핑 + 프로젝트 테마(축·툴팁·그리드 색상) 일괄 적용

// PlacementChart.tsx
interface PlacementChartProps {
  matches: Match[];               // types/domain.ts 의 Match
  className?: string;
}
export function PlacementChart(props: PlacementChartProps): JSX.Element
// 등수 1~8 빈도를 집계해 막대 그래프로 렌더. matches 가 비면 자체 안내 표시
```

---

## C-3. `frontend/src/components/feedback/DataNotCollected.tsx`

```tsx
interface DataNotCollectedProps {
  title?: string;      // 기본: '데이터 수집 전'
  message?: string;    // 화면별 맞춤 설명
  command?: string;    // 기본: 'python -m pipeline.run --players 3 --matches 5'
  icon?: string;       // 기본: '📭'
  className?: string;
}
export function DataNotCollected(props: DataNotCollectedProps): JSX.Element
```

---

## C-8. `frontend/src/pages/SummonerPage.tsx`

```tsx
// 신규 파생 계산 (페이지 내부 또는 lib/format 으로 승격 — Functional Design 에서 결정)
function summarize(matches: Match[]): {
  avgPlacement: number;   // 평균 등수
  top4Rate: number;       // 0~1
  count: number;
}
```

---

## C-9. `frontend/src/components/common/SearchBar.tsx`

```tsx
// 신규 파생 계산
function parseRiotId(input: string): { gameName: string; tagLine: string | null }
// '이름#KR1' → { gameName: '이름', tagLine: 'KR1' }
// '이름'      → { gameName: '이름', tagLine: null }  (백엔드가 지역 기본 태그 부착)
```

---

## 메서드 계약 원칙

| 원칙 | 내용 |
|---|---|
| **예외 비전파** | 백엔드 서비스 계층은 예외를 던지지 않고 빈 값으로 degrade. 기존 `has_data()` 패턴과 일관 |
| **시그니처 보존** | `champions()`·`items()` 의 이름과 반환 타입(`list[dict]`)을 유지해 `main.py` 변경을 최소화 |
| **원본/도메인 분리** | `cdragon.py` 는 원본 스키마만, `static_data.py` 는 도메인 모델만 다룬다 |
| **프론트 계약 불변** | 모든 반환 형태는 `types/domain.ts` 에 **이미 정의된** 필드만 사용. 새 필드를 프론트에 요구하지 않는다 |
