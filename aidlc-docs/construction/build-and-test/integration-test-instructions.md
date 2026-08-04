# Integration Test Instructions

유닛 간 연동을 검증한다. 자동화된 통합 테스트 스위트는 만들지 않았고(범위 밖),
**수동 검증 절차**를 정의한다. 아래 시나리오는 2026-08-04 에 실제로 수행되었으며 결과를 함께 기록한다.

---

## 환경 준비

```bash
cd backend && python -m uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm run dev
```

`frontend/.env` 는 `VITE_API_BASE_URL=http://localhost:8000/api`, `VITE_USE_MOCK=false`.

---

## 시나리오 1: U1 → API 계층 (백엔드 내부)

**대상**: `cdragon.py` → `static_data.py` → `main.py`

```bash
curl -s http://localhost:8000/api/champions | python -c "import sys,json;d=json.load(sys.stdin);print(len(d), d[0])"
```

```bash
curl -s http://localhost:8000/api/items | python -c "import sys,json;d=json.load(sys.stdin);print(len(d))"
```

| 기대 | **실측 (2026-08-04)** |
|---|---|
| 챔피언 63건, `traits` 비어 있지 않음, `iconUrl` 존재 | ✅ 63건, 63/63 특성 보유 |
| 아이템 65건 (조합 55 + 재료 10) | ✅ 65건 |
| 중복 표시명 0 | ✅ 0 |
| `recipe` 참조 무결성 위반 0 | ✅ 0 |

---

## 시나리오 2: U1 → U2 (백엔드 데이터가 프론트 필터를 살리는가)

**핵심 통합 지점** — U2 는 코드 변경 없이 U1 의 데이터만으로 동작해야 한다.

1. http://localhost:5173/champions 접속
2. 우측 상단 특성 드롭다운 열기
3. 특성 하나 선택

| 기대 | **실측** |
|---|---|
| 드롭다운에 실제 특성이 채워짐 | ✅ **36개 특성** (이전: 0개) |
| 선택 시 목록이 필터링됨 | ✅ 63명 → 3명 ("메카") |
| `ChampionsPage.tsx` 코드 변경 | ✅ **0줄** |

---

## 시나리오 3: U1 → U2 (아이템 분류·조합법)

1. http://localhost:5173/items 접속
2. 탭 카운트 확인
3. 조합 아이템 클릭 → Modal 확인

| 기대 | **실측** |
|---|---|
| 탭이 전체/조합/재료로 분리 | ✅ 전체 65 / 조합 55 / 재료 10 |
| Modal 에 조합법 표시 | ✅ 재료 아이콘 + `+` `=` 렌더 |
| 설명이 읽을 수 있는 문장 | ✅ `공격력 +10%` (정제 전: `공격력 %i:scaleAD%+@AD*100@%`) |
| `ItemsPage.tsx` 코드 변경 | ✅ **0줄** |

---

## 시나리오 4: U3 (데이터 부재 안내)

전처리 CSV 가 없는 상태에서 확인한다.

1. http://localhost:5173/statistics
2. http://localhost:5173/comps

| 기대 | **실측** |
|---|---|
| `-` 값 카드가 사라짐 | ✅ 0개 |
| "데이터 수집 전" 안내 표시 | ✅ |
| 수집 명령 표시 | ✅ `python -m pipeline.run --players 3 --matches 5` |
| 패치·티어 필터 비활성 | ✅ 2개 비활성, 툴팁에 사유 |

---

## 시나리오 5: U4 (차트)

**주의**: 라이브 Riot 키가 필요하다. 키 만료 시 목 모드로 검증한다.

```bash
# frontend/.env 에서 VITE_USE_MOCK=true 로 바꾸고 dev 서버 재시작
```

1. http://localhost:5173/summoner/kr/Faker

| 기대 | **실측 (목 모드)** |
|---|---|
| 등수 분포 차트 렌더 | ✅ 막대 8개 |
| 평균 등수·Top4율 표시 | ✅ 4.50등 / 50.0% / 표본 12판 |

---

## 시나리오 6: 회귀 — 목 모드 복귀 (NFR-6)

계약을 바꾸지 않았으므로 목 모드가 계속 동작해야 한다.

1. `frontend/.env` 에 `VITE_USE_MOCK=true`
2. dev 서버 재시작
3. 전 화면 확인

| 기대 | **실측** |
|---|---|
| 통계가 목 데이터로 정상 표시 | ✅ 분석된 게임 1,284,930 |
| `DataNotCollected` 미표시 | ✅ |
| 필터 활성화 | ✅ 비활성 0개 |
| 조합 목록 표시 | ✅ 8개 카드 |

검증 후 `VITE_USE_MOCK=false` 로 원복한다.

---

## 시나리오 7: Graceful Degradation

네트워크가 끊긴 상태에서도 500 이 나오면 안 된다.

```bash
cd backend && python -c "
import requests
from app.services import cdragon, static_data
requests.get = lambda *a, **kw: (_ for _ in ()).throw(requests.RequestException('blocked'))
static_data.reset_cache(); cdragon._read_disk = lambda s: None
print('champions:', len(static_data.champions()), 'items:', len(static_data.items()))
"
```

| 기대 | **실측** |
|---|---|
| 예외 없이 빈 목록 | ✅ champions=0, items=0 |
| 디스크 캐시만 있을 때 정상 | ✅ 63/75, **0.020초** |

---

## 라우트 전수 점검

```
/ · /search · /statistics · /items · /champions · /champions/:id
/leaderboard · /comps · /comps/:id · /arena · /404
```

| 기대 | **실측** |
|---|---|
| 전 라우트 렌더 | ✅ 11/11 |
| 콘솔 에러 | ✅ **0건** |

> `/summoner/:region/:name` 은 Riot 키 유효 시에만 실데이터로 검증 가능하다.
> 목 모드에서는 시나리오 5 로 검증했다.

---

## 정리

```bash
# dev 서버 종료 (Ctrl+C)
# 캐시 삭제가 필요하면
rm -rf data/cache/
```
