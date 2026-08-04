"""tft-gg 백엔드 API (FastAPI).

프론트엔드(frontend/src/api/*)가 기대하는 형식 그대로 JSON을 반환한다.

[전처리 데이터 기반 — 오프라인]
- /api/statistics : 전처리 데이터로 계산한 메타 통계
- /api/comps      : 전처리 데이터로 뽑은 조합 목록
- /api/champions  : DDragon 로컬 미러 챔피언 목록
- /api/items      : DDragon 로컬 미러 아이템 목록

[라이브 Riot API 기반 — 커밋 f48fe45 프로토타입 로직을 되살림]
- /api/summoner/{region}/{name} : 전적검색 (소환사 티어 + 최근 매치 등수)
- /api/leaderboard              : 서버 랭킹 (챌린저/그마/마스터)

실행: backend 폴더에서  uvicorn app.main:app --reload --port 8000
원본 CLI 출력 그대로 보기: backend 폴더에서  python -m app.cli
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .services import dataset, riot_live, static_data
from .services.riot_live import RiotError

app = FastAPI(title="tft-gg API", version="0.2.0")

# 개발용: Vite 프론트(다른 포트)에서 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "tft-gg",
        "endpoints": [
            "/api/statistics",
            "/api/comps",
            "/api/champions",
            "/api/items",
            "/api/summoner/{region}/{name}",
            "/api/leaderboard",
        ],
    }


# ── 전처리 데이터 기반 ────────────────────────────────────────────
@app.get("/api/statistics")
def statistics(patch: str | None = None, tier: str | None = None):
    """메타 통계.

    patch·tier 파라미터는 받되 아직 필터링에 쓰지 않는다. 전처리 데이터가 있어야
    의미 있는 필터가 가능하기 때문이다. 프론트가 '필터가 동작하지 않는다'는 사실을
    알 수 있도록 supportedFilters 로 지원 여부를 함께 알린다.
    (프론트는 이 값으로 드롭다운을 비활성화한다.)
    """
    result = dataset.compute_statistics()
    has_data = dataset.has_data()
    return {
        **result,
        "hasData": has_data,
        # 데이터가 생기면 여기부터 True 로 바꾸고 실제 필터링을 구현하면 된다.
        "supportedFilters": {"patch": False, "tier": False},
    }


@app.get("/api/comps")
def comps():
    return dataset.compute_comps()


@app.get("/api/champions")
def champions():
    return static_data.champions()


@app.get("/api/items")
def items():
    return static_data.items()


# ── 라이브 Riot API 기반 ──────────────────────────────────────────
@app.get("/api/leaderboard")
def leaderboard(region: str = "kr", tier: str = "all", page: int = 1):
    """서버 랭킹. 원본 프로토타입의 '한국 서버 전체 10등 출력' 을 페이지 단위로 확장한 것."""
    try:
        return riot_live.leaderboard(region=region, tier=tier, page=page)
    except RiotError as e:
        raise HTTPException(status_code=e.status, detail=e.message)


@app.get("/api/summoner/{region}/{name}")
def summoner(region: str, name: str):
    """전적검색. name 은 '소환사명#태그' 형식(태그 생략 시 지역 기본 태그 사용)."""
    try:
        return riot_live.summoner_profile(region=region, raw_name=name)
    except RiotError as e:
        raise HTTPException(status_code=e.status, detail=e.message)
