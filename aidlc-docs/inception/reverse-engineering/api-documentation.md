# API Documentation

베이스 URL: `http://localhost:8000` (프론트는 `VITE_API_BASE_URL=http://localhost:8000/api` 로 접근)
전 엔드포인트 **GET 전용**, 인증 없음, CORS `allow_origins=["*"] / allow_methods=["GET"]`.

## REST APIs

### 헬스체크
- **Method**: GET
- **Path**: `/`
- **Purpose**: 서비스 상태 및 엔드포인트 목록 반환
- **Response**: `{ "status": "ok", "service": "tft-gg", "endpoints": [...] }`

---

### 전적검색
- **Method**: GET
- **Path**: `/api/summoner/{region}/{name}`
- **Purpose**: 소환사 프로필(티어·LP·레벨·아이콘) + 최근 10판 등수/조합 조회
- **소스**: 라이브 Riot API (TTL 60초 캐시)
- **Request**
  - `region` (path) — `kr` | `na` | `euw` | `jp` | `br` | `oce`. 미지원 값은 `kr` 로 폴백
  - `name` (path) — `소환사명#태그`. 태그 생략 시 지역 기본 태그 자동 부착 (kr → `KR1`)
- **Response** (`SummonerResponse`)
```json
{
  "name": "hide on bush#KR1",
  "region": "KR",
  "tier": "Diamond II",
  "lp": 42,
  "level": 312,
  "iconUrl": "https://ddragon.leagueoflegends.com/cdn/{ver}/img/profileicon/29.png",
  "matches": [
    { "id": "KR_1234", "placement": 3, "comp": "빙하 총잡이",
      "playedAt": "2026-08-01T09:12:00+00:00", "queue": "ranked" }
  ]
}
```
- **Errors**: 401/403 키 만료 · 404 소환사 없음 · 429 한도 초과 → 한국어 메시지로 변환
- **주의**: `matches[].units` 는 타입에 정의돼 있으나 **백엔드가 채우지 않는다**

---

### 서버 랭킹
- **Method**: GET
- **Path**: `/api/leaderboard`
- **Purpose**: 챌린저/그마/마스터 리그를 LP 내림차순으로 페이지 조회
- **소스**: 라이브 Riot API (리그 TTL 300초 / 계정명 역조회 TTL 3600초)
- **Request (query)**
  - `region` (기본 `kr`) · `tier` (기본 `all`, 또는 `challenger`/`grandmaster`/`master`) · `page` (기본 1)
  - 페이지 크기 20 **고정** (프론트에서 조절 불가)
- **Response** (`LeaderboardResponse`)
```json
{ "rows": [ { "rank": 1, "name": "이름#KR1", "tier": "Challenger",
              "lp": 1500, "winRate": 0.52, "region": "kr" } ],
  "total": 750 }
```
- **주의**: `winRate` 는 `wins / (wins + losses)` 이며, 소스 주석상 원본 프로토타입의 **Top4율** 계산식이다. 라벨과 의미가 어긋날 수 있다
- **Errors**: 400 미지원 티어 · 401/403/429

---

### 메타 통계
- **Method**: GET
- **Path**: `/api/statistics`
- **Purpose**: 요약 카드 4종 + 증강체 TOP + 메타 조합 TOP5
- **소스**: `data/processed/tft_participants.csv`
- **Request (query)**: `patch`, `tier` — **선언되어 있으나 구현에서 무시된다**
- **Response** (`MetaStats`)
```json
{ "patch": "Set 17", "updatedAt": "2026-08-01T00:00:00+00:00",
  "summary": [ { "id": "games", "label": "분석된 게임", "value": "1,024" } ],
  "topAugments": [], "topComps": [] }
```
- **폴백**: CSV 부재 시 `patch: "수집 데이터 없음"`, 모든 `value: "-"`, 빈 배열
- **주의**: `topAugments` 는 **항상 빈 배열**. Set 17 매치 데이터에 `augments` 필드가 없음

---

### 조합 목록
- **Method**: GET
- **Path**: `/api/comps`
- **Purpose**: 데이터 기반 조합 티어리스트
- **소스**: `data/processed/tft_participants.csv`
- **Response**: `Comp[]` — 픽률 내림차순
```json
[ { "id": "빙하-총잡이", "name": "빙하 총잡이", "tier": "S",
    "coreUnits": ["벨베스", "..."], "avgPlacement": 3.87,
    "playRate": 0.0412, "description": "..." } ]
```
- **로직**: 활성 특성 중 유닛 수 상위 2개를 시그니처로 그룹핑 → 표본 15판 미만 제외 →
  평균등수로 S(<4.0)/A(<4.3)/B(<4.6)/C(<5.0)/D 매핑 → 핵심 유닛 상위 5
- **폴백**: CSV 부재 시 `[]`
- **주의**: `id` 가 한글 슬러그(`빙하-총잡이`)라 URL 경로(`/comps/:id`)에 인코딩 필요

---

### 챔피언 목록
- **Method**: GET
- **Path**: `/api/champions`
- **소스**: `data/TFT_DDragon/data/ko_KR/champion.json`
- **Response**: `Champion[]` — 비용·이름 순 정렬
- **주의**: **`traits` 가 항상 빈 배열.** DDragon 챔피언 데이터에 특성 연결이 없음
  → 프론트 `ChampionsPage` 의 특성 필터와 `ChampionDetailPage` 의 특성 표시가 비어 있게 된다
- **폴백**: 미러 부재 시 `[]`

---

### 아이템 목록
- **Method**: GET
- **Path**: `/api/items`
- **소스**: `data/TFT_DDragon/data/ko_KR/item.json`
- **Response**: `Item[]` — 이름순
- **주의**: **`type` 이 전부 `"combined"`, `recipe` 없음.**
  → 프론트 `ItemsPage` 의 '조합/기본 재료' 분류 탭이 실질적으로 동작하지 않는다
- **폴백**: 미러 부재 시 `[]`

## Frontend API Client Layer

| 훅 | 클라이언트 | 엔드포인트 | 목 폴백 |
|----|-----------|-----------|---------|
| `useSummoner(region, name)` | `fetchSummoner` | `/summoner/{region}/{name}` | `mockSummoner` — `error` 검색 시 에러, `empty` 검색 시 빈 목록 |
| `useLeaderboard(region, tier, page)` | `fetchLeaderboard` | `/leaderboard` | `mockLeaderboard(page)` |
| `useStatistics(patch, tier)` | `fetchStatistics` | `/statistics` | `mockStatistics` |
| `useChampions()` | `fetchChampions` | `/champions` | `mockChampions` |
| `useItems()` | `fetchItems` | `/items` | `mockItems` |
| `useComps()` | `fetchComps` | `/comps` | `mockComps` |

목/실 전환은 `api/client.ts` 의 `USE_MOCK` 한 곳에서 결정된다:
`VITE_USE_MOCK === 'true'` **또는** `VITE_API_BASE_URL` 이 빈 문자열이면 목 모드.

## Internal APIs

### `backend/app/services/riot_live.py`
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `summoner_profile` | `(region: str, raw_name: str, match_count: int = 10) -> dict` | 전적검색 응답 조립 |
| `leaderboard` | `(region='kr', tier='all', page=1, page_size=20) -> dict` | 랭킹 응답 조립 |
| `account_by_riot_id` | `(game_name, tag_line, region) -> dict` | 소환사명#태그 → puuid |
| `account_by_puuid` | `(puuid, region) -> dict` | puuid → 소환사명 역조회 |
| `summoner_by_puuid` | `(puuid, region) -> dict` | 레벨 · 아이콘 |
| `match_ids` | `(puuid, region, count=10) -> list[str]` | 최근 매치 ID |
| `match_detail` | `(match_id, region) -> dict` | 매치 상세 |
| `league_by_puuid` | `(puuid, region) -> list[dict]` | 큐별 랭크 정보 |
| `league_top` | `(tier='challenger', region='kr') -> dict` | Apex 리그 전체 |
| `split_riot_id` | `(raw, region) -> tuple[str, str]` | `이름#태그` 분리, 태그 생략 허용 |
| `format_tier` | `(entry: dict) -> str` | `Diamond II` 형태로 포맷 |
| `_comp_name` | `(participant, queue_id) -> str` | 상위 2개 특성으로 조합명 생성 |

### `backend/app/services/dataset.py`
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `has_data` | `() -> bool` | 전처리 CSV 존재 여부 |
| `compute_statistics` | `() -> dict` | 메타 통계 (부재 시 폴백) |
| `compute_comps` | `() -> list[dict]` | 조합 목록 (부재 시 `[]`) |

### `backend/app/services/static_data.py`
| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `champions` | `() -> list[dict]` | 현재 세트 챔피언 |
| `items` | `() -> list[dict]` | 조합 아이템 |

## Data Models

프론트엔드 `types/domain.ts` 가 계약의 단일 원천. 백엔드는 이 형태에 맞춰 응답한다.

| 모델 | 필드 | 비고 |
|------|------|------|
| `SummonerProfile` | `name, region, tier, lp, level, iconUrl?` | |
| `Match` | `id, placement(1~8), comp, playedAt(ISO), units?, queue?` | `units` 미구현 |
| `SummonerResponse` | `SummonerProfile & { matches: Match[] }` | |
| `StatCard` | `id, label, value, delta?` | `delta` 백엔드 미제공 |
| `AugmentStat` | `id, name, tier('silver'\|'gold'\|'prismatic'), pickRate, avgPlacement, iconUrl?` | 항상 빈 배열로 옴 |
| `MetaStats` | `patch, updatedAt, summary[], topAugments[], topComps[]` | |
| `Item` | `id, name, type('component'\|'combined'), recipe?, description?, iconUrl?` | 백엔드는 `combined` 만 반환 |
| `Champion` | `id, name, cost(1~5), traits[], iconUrl?` | `traits` 항상 `[]` |
| `RankRow` | `rank, name, tier, lp, winRate(0~1), region?` | |
| `LeaderboardResponse` | `rows[], total` | |
| `Comp` | `id, name, tier(S~D), coreUnits[], avgPlacement?, playRate?, description?` | |
| `Region` | `code, label` | 프론트 전용 |
| `RankTier` | `CHALLENGER` ~ `IRON` 유니온 | **선언만 되어 있고 API 응답은 문자열 `tier` 사용** |

### 계약 불일치 요약

| 항목 | 프론트 기대 | 백엔드 실제 |
|------|-------------|-------------|
| `Champion.traits` | 특성 문자열 배열 | 항상 `[]` |
| `Item.type` / `recipe` | `component`/`combined` 구분 + 재료 | 전부 `combined`, `recipe` 없음 |
| `Match.units` | 대표 유닛 배열 | 미제공 |
| `StatCard.delta` | 전 패치 대비 변동 | 미제공 |
| `AugmentStat` | 증강체 통계 | 항상 `[]` (Set 17 데이터에 필드 없음) |
| `/api/statistics` 의 `patch`·`tier` | 필터 반영 | 파라미터 무시 |
| `/api/champions` 아이콘 | `iconUrl` | 미제공 (프론트가 DDragon CDN 으로 자체 구성) |

## 미구현 엔드포인트 (프론트 화면은 있으나 API 없음)

- 챔피언 상세 통계 (평균등수 · 3성 확률 · 추천 아이템) — `ChampionDetailPage` 가 EmptyState 표시
- 조합 상세 가이드 (배치 · 아이템 우선순위 · 증강체) — `CompDetailPage` 가 EmptyState 표시
- 아이템별 통계 (평균등수 · 사용률)
- 결투장 전용 통계 — `/arena` 는 하드코딩 정적 페이지
- 매치 상세 (최종 보드 · 유닛 · 아이템)
