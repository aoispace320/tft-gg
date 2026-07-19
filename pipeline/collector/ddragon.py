"""DDragon(Data Dragon) TFT 정적 데이터 → 내부 ID를 사람이 읽는 이름으로 디코딩.

우선순위:
  1) 로컬 미러 repo (data/TFT_DDragon/data/ko_KR/) — 있으면 우선 사용(오프라인·완전).
  2) 공식 DDragon CDN — 미러가 없을 때 폴백(다운로드 후 data/ddragon/ 캐시).

매치 데이터의 character_id(예: 'TFT17_Belveth'), item/trait ID를 한글 이름으로 바꾼다.
매핑이 없으면 원본 ID를 그대로 둔다.
"""
import json
import os

import requests

_LANG = "ko_KR"
_HERE = os.path.dirname(__file__)
# 로컬 미러 repo 경로
_REPO_DIR = os.path.join(_HERE, "..", "..", "data", "TFT_DDragon", "data", _LANG)
# CDN 폴백 캐시 경로
_CACHE_DIR = os.path.join(_HERE, "..", "..", "data", "ddragon")

# (종류) → (로컬 미러 파일명, 공식 CDN 파일명)
_FILES = {
    "champion": ("champion.json", "tft-champion.json"),
    "item": ("item.json", "tft-item.json"),
    "trait": ("trait.json", "tft-trait.json"),
    "augments": ("augments.json", "tft-augments.json"),
}


def _latest_version() -> str:
    versions = requests.get("https://ddragon.leagueoflegends.com/api/versions.json", timeout=15).json()
    return versions[0]


def _load_local(kind: str) -> dict | None:
    path = os.path.join(_REPO_DIR, _FILES[kind][0])
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def _load_cdn(version: str, kind: str) -> dict | None:
    os.makedirs(_CACHE_DIR, exist_ok=True)
    filename = _FILES[kind][1]
    cache_path = os.path.join(_CACHE_DIR, filename)
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    url = f"https://ddragon.leagueoflegends.com/cdn/{version}/data/{_LANG}/{filename}"
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        print(f"  · CDN {filename} 없음({resp.status_code}) — 이 종류는 ID 그대로 사용")
        return None
    data = resp.json()
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    return data


def _to_name_map(data: dict | None) -> dict[str, str]:
    """DDragon {data: {KEY: {id, name}}} → {ID: name} 평탄화.
    KEY가 경로형(예: 'Maps/.../TFT17_Belveth')이어도 엔트리의 id 필드로도 매핑한다."""
    if not data:
        return {}
    entries = data.get("data", data)
    out = {}
    for key, val in entries.items():
        if not isinstance(val, dict):
            continue
        name = val.get("name") or key
        out[key] = name
        vid = val.get("id")
        if vid:
            out[vid] = name
    return out


class DDragon:
    """ID → 한글 이름 디코더."""

    def __init__(self, version: str | None = None):
        self.use_repo = os.path.isdir(_REPO_DIR)
        self.source = "로컬 미러 TFT_DDragon" if self.use_repo else "공식 DDragon CDN"
        self._version = version  # CDN 폴백 시에만 lazy 로드

        maps = {}
        for kind in _FILES:
            data = _load_local(kind) if self.use_repo else None
            if data is None:  # 미러에 없으면 CDN 폴백
                data = _load_cdn(self._version_str(), kind)
            maps[kind] = _to_name_map(data)

        self.champions = maps["champion"]
        self.items = maps["item"]
        self.traits = maps["trait"]
        self.augments = maps["augments"]
        print(f"DDragon 소스: {self.source} (챔피언 {len(self.champions)} · 특성 {len(self.traits)} · 증강 {len(self.augments)})")

    def _version_str(self) -> str:
        if self._version is None:
            self._version = _latest_version()
        return self._version

    def champ(self, cid: str) -> str:
        return self.champions.get(cid, cid)

    def item(self, iid: str) -> str:
        return self.items.get(iid, iid)

    def trait(self, tid: str) -> str:
        return self.traits.get(tid, tid)

    def augment(self, aid: str) -> str:
        return self.augments.get(aid, aid)
