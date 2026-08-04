# Build Instructions

## Prerequisites

| 항목 | 요구사항 |
|---|---|
| **Node.js** | 18+ (Vite 6 요구) |
| **Python** | 3.10+ (`str \| None` PEP 604 문법 사용) |
| **npm** | Node 동봉 버전 |
| **디스크** | `data/cache/` 에 약 3MB (CDragon 스냅샷) |
| **네트워크** | 최초 1회 Community Dragon 접근 필요 (약 25MB 다운로드) |

### 환경변수

| 변수 | 위치 | 필수 | 설명 |
|---|---|---|---|
| `riot_api_key` | 루트 `.env` | 전적검색·랭킹에만 | 개발용 키는 **24시간마다 만료** |
| `TFT_SET` | 루트 `.env` | 아니오 | 대상 세트. 미설정 시 `17` |
| `VITE_API_BASE_URL` | `frontend/.env` | 아니오 | 미설정 시 목 모드로 폴백 |
| `VITE_USE_MOCK` | `frontend/.env` | 아니오 | `true` 면 목 데이터 사용 |

---

## Build Steps

### 1. 의존성 설치

```bash
cd backend && pip install -r requirements.txt
```

```bash
cd frontend && npm install
```

> `pandas` 와 `pytest` 가 이번 작업에서 `requirements.txt` 에 추가되었다.
> 기존에는 `pandas` 선언이 빠져 있어 깨끗한 환경에서 통계·조합 API 가 `ImportError` 로 죽었다.

### 2. 환경 구성

```bash
cp .env.example .env
```

```bash
cp frontend/.env.example frontend/.env
```

실 백엔드에 연결하려면 `frontend/.env` 를 이렇게 둔다:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

### 3. 빌드

```bash
cd frontend && npm run build
```

백엔드는 빌드 단계가 없다 (인터프리터 실행).

### 4. 실행

```bash
cd backend && python -m uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm run dev
```

프론트엔드는 http://localhost:5173 에서 열린다.

---

## Verify Build Success

**기대 출력**

```
✓ 784 modules transformed.
dist/index.html                  0.93 kB │ gzip:   0.53 kB
dist/assets/index-*.css         27.10 kB │ gzip:   5.73 kB
dist/assets/index-*.js         716.51 kB │ gzip: 223.71 kB
✓ built in ~4s
```

**빌드 산출물**: `frontend/dist/`

**허용되는 경고**

| 경고 | 판단 |
|---|---|
| `Some chunks are larger than 500 kB` | 정상. Recharts 도입으로 번들이 커졌다. 로컬 개발 기준이므로 코드 분할은 하지 않았다 |
| `npm audit` 취약점 보고 | 개발 의존성 범위. 이번 작업 범위 밖 |

---

## Troubleshooting

### 통계·조합 API 가 500 (`ImportError: pandas`)
- **원인**: `pandas` 미설치
- **해결**: `pip install -r backend/requirements.txt`

### 챔피언·아이템이 빈 목록
- **원인**: Community Dragon 접근 실패 (네트워크 차단·방화벽)
- **확인**: `curl -I https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json`
- **동작**: 실패해도 500 이 아니라 빈 목록을 반환한다 (의도된 degrade)
- **캐시 강제 갱신**: `rm -rf data/cache/`

### 전적검색·랭킹이 401
- **원인**: Riot 개발용 키 만료 (24시간)
- **해결**: https://developer.riotgames.com 에서 재발급 후 루트 `.env` 의 `riot_api_key` 갱신

### 첫 요청이 오래 걸림
- **원인**: Community Dragon 최초 페치 (약 25MB)
- **정상**: 이후 `data/cache/cdragon_set17.json` 히트로 수십 ms

### 타입 오류
```bash
cd frontend && npm run typecheck
```
