"""DDragon 로컬 미러에서 챔피언/아이템 목록을 만든다 (아이콘 제외, 이름·비용 등만).

data/TFT_DDragon/data/ko_KR/{champion,item}.json 을 읽는다. 없으면 빈 목록.
"""
import json
import os
from functools import lru_cache

_HERE = os.path.dirname(__file__)
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))
_DD = os.path.join(_ROOT, "data", "TFT_DDragon", "data", "ko_KR")

_CURRENT_SET_PREFIX = "TFT17_"


def _load(name: str) -> dict:
    path = os.path.join(_DD, name)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f).get("data", {})


@lru_cache(maxsize=1)
def champions() -> list[dict]:
    """현재 세트 플레이어블 챔피언 (id, name, cost, traits[])."""
    data = _load("champion.json")
    seen: dict[str, dict] = {}
    for val in data.values():
        cid = val.get("id", "")
        cost = val.get("cost")
        if not cid.startswith(_CURRENT_SET_PREFIX):
            continue
        if "Summon" in cid or "PVE" in cid:
            continue
        if cost not in (1, 2, 3, 4, 5):
            continue
        seen[cid] = {
            "id": cid,
            "name": val.get("name", cid),
            "cost": cost,
            "traits": [],  # DDragon 챔피언 데이터엔 특성 연결이 없어 비움
        }
    return sorted(seen.values(), key=lambda c: (c["cost"], c["name"]))


@lru_cache(maxsize=1)
def items() -> list[dict]:
    """조합 아이템 목록 (id, name, type). 재료(recipe)는 데이터에 없어 생략."""
    data = _load("item.json")
    out: dict[str, dict] = {}
    for val in data.values():
        iid = val.get("id", "")
        name = val.get("name", "")
        # 실제 아이템만: '_Item_' 포함, 템플릿(@)·퀘스트·튜토리얼 제외
        if "_Item_" not in iid:
            continue
        if not name or "@" in name or "Tutorial" in iid or "Quest" in iid:
            continue
        out[iid] = {"id": iid, "name": name, "type": "combined"}
    return sorted(out.values(), key=lambda i: i["name"])
