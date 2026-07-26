"""라이브 Riot API 서비스 — 전적검색(/api/summoner)과 랭킹(/api/leaderboard)의 데이터 소스.

커밋 f48fe45 "소환사의 티어 출력, 한국 서버 전체 10등 출력" 의 프로토타입 스크립트를
그대로 되살린 것이다. 원본은 input()/print() 로 동작하는 CLI 였기 때문에 그대로
main.py 에 두면 uvicorn 기동 시 입력 대기에 걸려 서버가 뜨지 않는다.
그래서 '호출 순서와 로직은 동일하게' 유지한 채 함수로만 쪼갰다.

원본 CLI 출력을 그대로 보고 싶으면:  backend 폴더에서  python -m app.cli

원본 스크립트의 호출 순서(그대로 유지):
  1) account-v1  by-riot-id       : 소환사명#태그 → puuid
  2) tft/summoner-v1 by-puuid     : 소환사 레벨 · 아이콘
  3) tft/match-v1  by-puuid/ids   : 최근 매치 ID 목록
  4) tft/match-v1  matches/{id}   : 매치별 큐 종류 + 내 등수
  5) tft/league-v1 by-puuid       : 솔로랭크 / 더블업 / 하이퍼롤 티어
  6) tft/league-v1 challenger     : 한국 서버 상위 랭킹 (+ puuid → 소환사명 역조회)
"""
from __future__ import annotations

import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import dotenv
import requests

_HERE = os.path.dirname(__file__)
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))

# 원본과 동일하게 프로젝트 루트의 .env 에서 riot_api_key 를 읽는다.
dotenv.load_dotenv(os.path.join(_ROOT, ".env"))

# ── 라우팅 ────────────────────────────────────────────────────────
# 플랫폼(platform) 라우팅 — summoner, league API 용
PLATFORM_HOSTS = {
    "kr": "kr.api.riotgames.com",
    "na": "na1.api.riotgames.com",
    "euw": "euw1.api.riotgames.com",
    "jp": "jp1.api.riotgames.com",
    "br": "br1.api.riotgames.com",
    "oce": "oc1.api.riotgames.com",
}
# 대륙(continent) 라우팅 — account, match API 용
CONTINENT_HOSTS = {
    "kr": "asia.api.riotgames.com",
    "jp": "asia.api.riotgames.com",
    "na": "americas.api.riotgames.com",
    "br": "americas.api.riotgames.com",
    "euw": "europe.api.riotgames.com",
    "oce": "sea.api.riotgames.com",
}
# '#태그' 를 생략하고 검색했을 때 붙여줄 기본 태그
DEFAULT_TAGS = {"kr": "KR1", "na": "NA1", "euw": "EUW", "jp": "JP1", "br": "BR1", "oce": "OC1"}

# 원본 스크립트의 queue_id → 모드 이름 매핑 (+ PVE 큐 1220 추가)
QUEUE_NAMES = {
    1160: "더블업 모드",
    1150: "더블업 모드",
    1100: "랭크 게임",
    1090: "일반 게임",
    1130: "초고속 모드",
    1220: "전략가의 시험",  # PVE — 특성/조합 정보가 없다
}
# 프론트(types/domain.ts 의 Match.queue)가 쓰는 코드값
QUEUE_CODES = {
    1160: "double_up",
    1150: "double_up",
    1100: "ranked",
    1090: "normal",
    1130: "turbo",
    1220: "pve",
}

APEX_TIERS = ("CHALLENGER", "GRANDMASTER", "MASTER")
# DDragon 버전은 고정하지 않는다. 구버전에는 현재 시즌 특성이 없어 조합 이름이
# 영문 ID(예: 'DarkStar HPTank')로 나온다. 최신 버전을 1회 조회해 캐시한다.
_DDRAGON_FALLBACK = "14.24.1"
_ddragon_version: str | None = None


class RiotError(RuntimeError):
    """Riot API 호출 실패. status 를 그대로 HTTP 응답 코드로 쓴다."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _message_for(status: int, url: str) -> str:
    if status in (401, 403):
        return "Riot API 키가 만료되었거나 유효하지 않습니다. .env 의 riot_api_key 를 갱신하세요 (개발용 키는 24시간마다 만료)."
    if status == 404:
        return "해당 소환사를 찾을 수 없습니다. 소환사명#태그 를 확인하세요."
    if status == 429:
        return "Riot API 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요."
    return f"Riot API 요청 실패 ({status})"


def _api_key() -> str:
    key = os.environ.get("riot_api_key")
    if not key:
        raise RiotError(500, ".env 에서 riot_api_key 를 찾을 수 없습니다.")
    return key


_session = requests.Session()


def _get(url: str, params: dict | None = None, *, retries: int = 3):
    """원본의 requests.get(url, headers=headers) 에 429/5xx 재시도만 덧붙인 것."""
    headers = {"X-Riot-Token": _api_key()}
    for _ in range(retries):
        resp = _session.get(url, headers=headers, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 429:
            time.sleep(min(int(resp.headers.get("Retry-After", "2")), 5))
            continue
        if resp.status_code in (500, 502, 503, 504):
            time.sleep(1)
            continue
        raise RiotError(resp.status_code, _message_for(resp.status_code, url))
    raise RiotError(429, _message_for(429, url))


# ── 아주 단순한 TTL 캐시 ──────────────────────────────────────────
# 개발용 키는 2분당 100회 제한이라 같은 검색을 반복하면 금방 막힌다.
_cache: dict[str, tuple[float, object]] = {}
_cache_lock = threading.Lock()


def _cached(key: str, ttl: float, producer):
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    value = producer()
    with _cache_lock:
        _cache[key] = (time.time(), value)
    return value


# ── Riot 엔드포인트 (원본 URL 그대로) ─────────────────────────────
def _platform(region: str) -> str:
    return PLATFORM_HOSTS.get(region.lower(), PLATFORM_HOSTS["kr"])


def _continent(region: str) -> str:
    return CONTINENT_HOSTS.get(region.lower(), CONTINENT_HOSTS["kr"])


def account_by_riot_id(game_name: str, tag_line: str, region: str = "kr") -> dict:
    """원본: account_url — 소환사명#태그 → puuid"""
    url = f"https://{_continent(region)}/riot/account/v1/accounts/by-riot-id/{requests.utils.quote(game_name)}/{requests.utils.quote(tag_line)}"
    return _get(url)


def account_by_puuid(puuid: str, region: str = "kr") -> dict:
    """원본: summoner_name — puuid → gameName#tagLine (랭킹에서 이름 역조회용)"""
    url = f"https://{_continent(region)}/riot/account/v1/accounts/by-puuid/{puuid}"
    return _get(url)


def summoner_by_puuid(puuid: str, region: str = "kr") -> dict:
    """원본: summoner_url — 소환사 레벨 · 프로필 아이콘"""
    url = f"https://{_platform(region)}/tft/summoner/v1/summoners/by-puuid/{puuid}"
    return _get(url)


def match_ids(puuid: str, region: str = "kr", count: int = 10) -> list[str]:
    """원본: match_list_url"""
    url = f"https://{_continent(region)}/tft/match/v1/matches/by-puuid/{puuid}/ids"
    return _get(url, params={"count": count}) or []


def match_detail(match_id: str, region: str = "kr") -> dict:
    """원본: detail_url"""
    url = f"https://{_continent(region)}/tft/match/v1/matches/{match_id}"
    return _get(url)


def league_by_puuid(puuid: str, region: str = "kr") -> list[dict]:
    """원본: tier_url — 솔로랭크/더블업/하이퍼롤 랭크 정보 배열"""
    url = f"https://{_platform(region)}/tft/league/v1/by-puuid/{puuid}"
    return _get(url) or []


def league_top(tier: str = "challenger", region: str = "kr") -> dict:
    """원본: challenger_url — 챌린저/그랜드마스터/마스터 리그 전체"""
    tier = tier.lower()
    if tier not in ("challenger", "grandmaster", "master"):
        raise RiotError(400, f"지원하지 않는 티어입니다: {tier}")
    url = f"https://{_platform(region)}/tft/league/v1/{tier}"
    return _get(url) or {}


# ── 표시용 변환 ───────────────────────────────────────────────────
def split_riot_id(raw: str, region: str = "kr") -> tuple[str, str]:
    """'hide on bush#KR1' → ('hide on bush', 'KR1').

    원본은 raw.split('#')[1] 이라 '#' 이 없으면 IndexError 로 죽었다.
    여기서는 태그를 생략하면 지역 기본 태그를 붙인다.
    """
    text = raw.strip()
    if "#" in text:
        game_name, _, tag_line = text.partition("#")
        game_name, tag_line = game_name.strip(), tag_line.strip()
        if game_name:
            return game_name, (tag_line or DEFAULT_TAGS.get(region, "KR1"))
    return text, DEFAULT_TAGS.get(region, "KR1")


def format_tier(entry: dict) -> str:
    """{'tier':'DIAMOND','rank':'II'} → 'Diamond II' (챌린저/그마/마스터는 단계 없음)."""
    tier = (entry.get("tier") or entry.get("ratedTier") or "").upper()
    if not tier:
        return "언랭크"
    if tier in APEX_TIERS:
        return tier.title()
    rank = entry.get("rank") or ""
    return f"{tier.title()} {rank}".strip()


def ddragon_version() -> str:
    """최신 DDragon 버전(예: '16.14.1'). 조회 실패 시 폴백 버전."""
    global _ddragon_version
    if _ddragon_version is None:
        env = os.environ.get("DDRAGON_VERSION")
        if env:
            _ddragon_version = env
        else:
            try:
                versions = requests.get(
                    "https://ddragon.leagueoflegends.com/api/versions.json", timeout=10
                ).json()
                _ddragon_version = versions[0]
            except (requests.RequestException, IndexError, ValueError):
                _ddragon_version = _DDRAGON_FALLBACK
    return _ddragon_version


_trait_names: dict[str, str] | None = None


def _trait_name_map() -> dict[str, str]:
    """특성 ID(TFT17_Glacier) → 한글 이름. 로컬 DDragon 미러 → CDN 순으로 시도."""
    global _trait_names
    if _trait_names is not None:
        return _trait_names

    import json

    local = os.path.join(_ROOT, "data", "TFT_DDragon", "data", "ko_KR", "trait.json")
    data = None
    if os.path.exists(local):
        with open(local, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        try:
            url = f"https://ddragon.leagueoflegends.com/cdn/{ddragon_version()}/data/ko_KR/tft-trait.json"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
        except requests.RequestException:
            data = None

    names: dict[str, str] = {}
    for key, val in (data or {}).get("data", {}).items():
        if isinstance(val, dict):
            name = val.get("name") or key
            names[key] = name
            if val.get("id"):
                names[val["id"]] = name
    _trait_names = names
    return names


def _comp_name(participant: dict, queue_id: int | None = None) -> str:
    """활성 특성 중 유닛 수 상위 2개로 조합 이름을 만든다 (dataset.py 의 조합 시그니처와 동일한 방식)."""
    traits = [t for t in participant.get("traits", []) if t.get("tier_current", 0) > 0]
    if not traits:
        # PVE 등 일부 모드는 특성 데이터가 아예 없다 → 모드 이름으로 대체
        return QUEUE_NAMES.get(queue_id, "조합 정보 없음")
    top = sorted(traits, key=lambda t: t.get("num_units", 0), reverse=True)[:2]
    names = _trait_name_map()
    labels = []
    for t in top:
        tid = t.get("name", "")
        labels.append(names.get(tid) or re.sub(r"^TFT\d*_", "", tid))
    return " ".join(labels)


def profile_icon_url(icon_id: int | str) -> str:
    return f"https://ddragon.leagueoflegends.com/cdn/{ddragon_version()}/img/profileicon/{icon_id}.png"


# ── 프론트가 소비하는 최종 형태 ───────────────────────────────────
def summoner_profile(region: str, raw_name: str, match_count: int = 10) -> dict:
    """types/domain.ts 의 SummonerResponse 형태로 반환.

    원본 스크립트의 1~5단계를 그대로 수행한다.
    """
    region = region.lower()
    game_name, tag_line = split_riot_id(raw_name, region)

    def build() -> dict:
        # 1) 소환사명#태그 → puuid
        account = account_by_riot_id(game_name, tag_line, region)
        puuid = account.get("puuid")
        if not puuid:
            raise RiotError(404, "해당 소환사를 찾을 수 없습니다.")

        # 2) 소환사 레벨 · 아이콘
        try:
            summoner = summoner_by_puuid(puuid, region)
        except RiotError:
            summoner = {}

        # 3~4) 최근 매치 ID → 매치별 내 등수 (원본은 순차 루프, 여기선 병렬로만 바꿈)
        ids = match_ids(puuid, region, count=match_count)

        def one(mid: str) -> dict | None:
            try:
                detail = match_detail(mid, region)
            except RiotError:
                return None  # 원본의 'status_code != 200 이면 continue' 와 동일
            info = detail.get("info", {})
            me = next((p for p in info.get("participants", []) if p.get("puuid") == puuid), None)
            if not me:
                return None
            queue_id = info.get("queue_id") or info.get("queueId")
            played_ms = info.get("game_datetime") or 0
            return {
                "id": mid,
                "placement": me.get("placement", 0),
                "comp": _comp_name(me, queue_id),
                "playedAt": datetime.fromtimestamp(played_ms / 1000, tz=timezone.utc).isoformat(),
                "queue": QUEUE_CODES.get(queue_id, "other"),
            }

        with ThreadPoolExecutor(max_workers=5) as pool:
            matches = [m for m in pool.map(one, ids) if m]

        # 5) 티어 — 솔로랭크(RANKED_TFT) 우선, 없으면 첫 항목
        entries = league_by_puuid(puuid, region)
        solo = next((e for e in entries if e.get("queueType") == "RANKED_TFT"), None)
        chosen = solo or (entries[0] if entries else {})

        return {
            "name": f"{account.get('gameName', game_name)}#{account.get('tagLine', tag_line)}",
            "region": region.upper(),
            "tier": format_tier(chosen) if chosen else "언랭크",
            "lp": chosen.get("leaguePoints", chosen.get("ratedRating", 0)) if chosen else 0,
            "level": summoner.get("summonerLevel", 0),
            "iconUrl": profile_icon_url(summoner.get("profileIconId", 29)),
            "matches": matches,
        }

    return _cached(f"summoner:{region}:{game_name}#{tag_line}:{match_count}", 60.0, build)


def leaderboard(region: str = "kr", tier: str = "all", page: int = 1, page_size: int = 20) -> dict:
    """types/domain.ts 의 LeaderboardResponse 형태로 반환.

    원본은 '챌린저 상위 10명' 고정이었다. 프론트가 티어 탭 + 페이지네이션을 쓰므로
    티어 선택과 페이지 슬라이싱을 붙였다. 이름 역조회는 페이지에 보이는 인원만 한다
    (리그 전체는 수백 명이라 전원 조회하면 레이트리밋에 즉시 걸린다).
    """
    region = region.lower()
    tiers = ("challenger", "grandmaster", "master") if tier in ("all", "", None) else (tier.lower(),)

    def collect() -> list[dict]:
        rows: list[dict] = []
        for t in tiers:
            league = league_top(t, region)
            for e in league.get("entries", []):
                rows.append({**e, "_tier": t.upper()})
        # 원본과 동일: leaguePoints 내림차순 정렬
        rows.sort(key=lambda e: e.get("leaguePoints", 0), reverse=True)
        return rows

    entries = _cached(f"league:{region}:{'+'.join(tiers)}", 300.0, collect)

    start = max(0, (page - 1) * page_size)
    page_entries = entries[start : start + page_size]

    def resolve(item: tuple[int, dict]) -> dict:
        idx, e = item
        puuid = e.get("puuid", "")
        wins, losses = e.get("wins", 0), e.get("losses", 0)
        total = wins + losses
        try:
            account = _cached(f"account:{region}:{puuid}", 3600.0, lambda: account_by_puuid(puuid, region))
            name = f"{account.get('gameName', '')}#{account.get('tagLine', '')}"
        except RiotError:
            name = "(이름 조회 실패)"
        return {
            "rank": start + idx + 1,
            "name": name,
            "tier": e.get("_tier", "").title(),
            "lp": e.get("leaguePoints", 0),
            # 원본의 top_4_rate 계산식과 동일 (프론트는 0~1 비율로 받는다)
            "winRate": (wins / total) if total else 0.0,
            "region": region,
        }

    with ThreadPoolExecutor(max_workers=5) as pool:
        rows = list(pool.map(resolve, enumerate(page_entries)))

    return {"rows": rows, "total": len(entries)}
