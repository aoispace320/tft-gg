"""tft-gg 백엔드 API (FastAPI).

프론트엔드(frontend/src/api/*)가 기대하는 형식 그대로 JSON을 반환한다.
- /api/statistics : 전처리 데이터로 계산한 메타 통계
- /api/comps      : 전처리 데이터로 뽑은 조합 목록
- /api/champions  : DDragon 로컬 미러 챔피언 목록
- /api/items      : DDragon 로컬 미러 아이템 목록

실행: backend 폴더에서  uvicorn app.main:app --reload --port 8000
(기존 Riot 프로토타입 스크립트는 git 이력 및 pipeline/ 에 로직이 남아 있음)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services import dataset, static_data

app = FastAPI(title="tft-gg API", version="0.1.0")

# 개발용: Vite 프론트(다른 포트)에서 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "service": "tft-gg", "endpoints": ["/api/statistics", "/api/comps", "/api/champions", "/api/items"]}


@app.get("/api/statistics")
def statistics(patch: str | None = None, tier: str | None = None):
    return dataset.compute_statistics()


@app.get("/api/comps")
def comps():
    return dataset.compute_comps()


@app.get("/api/champions")
def champions():
    return static_data.champions()


@app.get("/api/items")
def items():
    return static_data.items()


# ── Phase 2 (라이브 Riot API) 자리표시 스텁 ─────────────────────
# 아직 미구현. 실API 모드에서 프론트가 에러나지 않도록 빈/기본 응답을 준다.
@app.get("/api/leaderboard")
def leaderboard(region: str | None = None, tier: str | None = None, page: int = 1):
    return {"rows": [], "total": 0}


@app.get("/api/summoner/{region}/{name}")
def summoner(region: str, name: str):
    return {
        "name": name,
        "region": region,
        "tier": "-",
        "lp": 0,
        "level": 0,
        "matches": [],
    }
