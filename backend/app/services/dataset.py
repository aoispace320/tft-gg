"""전처리된 참가자 데이터(data/processed/tft_participants.csv)에서
프론트가 기대하는 통계(MetaStats)와 조합(Comp) 목록을 계산한다.

무거운 계산은 최초 1회만 하고 메모리에 캐시한다.
"""
import json
import os
import re
from datetime import datetime, timezone
from functools import lru_cache

import pandas as pd

_HERE = os.path.dirname(__file__)
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))
_CSV = os.path.join(_ROOT, "data", "processed", "tft_participants.csv")

# ═══════════════════════════════════════════════════════════════════
# [자동 전환] 위 CSV 파일이 있으면 실제 통계, 없으면 아래 '데이터 없음' 값.
#
#   데이터를 수집하려면:  python -m pipeline.run --players 3 --matches 5
#   → CSV 가 생기는 순간 코드 수정 없이 실제 통계로 바뀐다. (서버 재시작 불필요)
#
#   화면에 보이는 '데이터 없음' 문구를 바꾸고 싶으면 이 두 줄만 고치면 된다.
# ═══════════════════════════════════════════════════════════════════
NO_DATA_PATCH = "수집 데이터 없음"
NO_DATA_VALUE = "-"

# 조합 티어를 평균 등수로 구분 (낮을수록 좋음)
def _tier_for(avg: float) -> str:
    if avg < 4.0:
        return "S"
    if avg < 4.3:
        return "A"
    if avg < 4.6:
        return "B"
    if avg < 5.0:
        return "C"
    return "D"


def _slug(text: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]+", "-", text.lower()).strip("-")


def has_data() -> bool:
    """전처리 CSV 존재 여부. 없으면 500 대신 빈 응답을 돌려준다."""
    return os.path.exists(_CSV)


@lru_cache(maxsize=1)
def _df() -> pd.DataFrame:
    return pd.read_csv(_CSV)


def _parse_named_counts(cell: str) -> list[tuple[str, int]]:
    """'["빙하(6)", "총잡이(5)"]' → [('빙하',6), ('총잡이',5)]"""
    out = []
    for token in json.loads(cell):
        m = re.match(r"(.+?)\((\d+)\)$", token)
        if m:
            out.append((m.group(1), int(m.group(2))))
    return out


def _unit_names(cell: str) -> list[str]:
    """'["벨베스(★2)", ...]' → ['벨베스', ...]"""
    return [t.split("(")[0] for t in json.loads(cell)]


def compute_comps() -> list[dict]:
    """조합 목록. 전처리 데이터가 없으면 빈 목록(프론트는 '데이터 없음' 표시)."""
    if not has_data():
        return []
    return _compute_comps()


@lru_cache(maxsize=1)
def _compute_comps() -> list[dict]:
    """보드를 '대표 특성 2개' 기준으로 묶어 데이터 기반 조합 목록 생성."""
    df = _df()
    total = len(df)
    groups: dict[str, dict] = {}

    for _, row in df.iterrows():
        traits = _parse_named_counts(row["traits"])
        if not traits:
            continue
        # 유닛 수가 많은 상위 2개 특성을 조합 시그니처로
        top = sorted(traits, key=lambda t: t[1], reverse=True)[:2]
        key = " ".join(t[0] for t in top)
        g = groups.setdefault(key, {"placements": [], "units": {}})
        g["placements"].append(int(row["placement"]))
        for u in _unit_names(row["units"]):
            g["units"][u] = g["units"].get(u, 0) + 1

    comps = []
    for key, g in groups.items():
        n = len(g["placements"])
        if n < 15:  # 표본 너무 적은 조합은 노이즈로 제외
            continue
        avg = sum(g["placements"]) / n
        core = [u for u, _ in sorted(g["units"].items(), key=lambda x: x[1], reverse=True)[:5]]
        comps.append(
            {
                "id": _slug(key) or "comp",
                "name": key,
                "tier": _tier_for(avg),
                "coreUnits": core,
                "avgPlacement": round(avg, 2),
                "playRate": round(n / total, 4),
                "description": f"{key} 시너지 중심 조합 (표본 {n}판, 평균 {avg:.2f}등).",
            }
        )
    # 픽률 높은 순
    comps.sort(key=lambda c: c["playRate"], reverse=True)
    return comps


def compute_statistics() -> dict:
    """메타 통계. 전처리 데이터가 없으면 빈 카드 세트를 돌려준다(500 방지)."""
    if not has_data():
        return {
            "patch": NO_DATA_PATCH,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "summary": [
                {"id": "games", "label": "분석된 게임", "value": NO_DATA_VALUE},
                {"id": "rows", "label": "분석 참가자 표본", "value": NO_DATA_VALUE},
                {"id": "meta-comps", "label": "메타 조합 수", "value": NO_DATA_VALUE},
                {"id": "avg-units", "label": "평균 유닛 수", "value": NO_DATA_VALUE},
            ],
            "topAugments": [],
            "topComps": [],
        }
    return _compute_statistics()


@lru_cache(maxsize=1)
def _compute_statistics() -> dict:
    df = _df()
    comps = compute_comps()
    matches = int(df["match_id"].nunique())
    rows = len(df)
    top4_rate = float((df["placement"] <= 4).mean())
    avg_units = float(df["num_units"].mean())
    updated = datetime.fromtimestamp(os.path.getmtime(_CSV), tz=timezone.utc).isoformat()

    return {
        "patch": "Set 17",
        "updatedAt": updated,
        "summary": [
            {"id": "games", "label": "분석된 게임", "value": f"{matches:,}"},
            {"id": "rows", "label": "분석 참가자 표본", "value": f"{rows:,}"},
            {"id": "meta-comps", "label": "메타 조합 수", "value": str(len(comps))},
            {"id": "avg-units", "label": "평균 유닛 수", "value": f"{avg_units:.1f}"},
        ],
        "topAugments": [],  # Set 17 매치 데이터엔 증강체 정보 없음
        "topComps": comps[:5],
    }
