"""Community Dragon 게이트웨이 — 정적 게임 데이터(챔피언·특성·아이템)의 유일한 외부 접근 지점.

왜 DDragon 이 아니라 Community Dragon 인가:
    공식 DDragon(그리고 noxelisdev/TFT_DDragon 미러) 의 챔피언 데이터에는
    {id, name, tier, cost, image} 만 있고 **특성(traits) 연결이 없다.** 아이템 조합법도 없다.
    실측 확인 결과 두 소스 모두 traits 보유 항목이 0개였다.
    Community Dragon 은 챔피언별 특성(한글 이름)과 아이템 composition 을 모두 제공하므로
    이쪽으로 교체했다. 부수 효과로 수백 MB 짜리 로컬 미러 클론이 불필요해졌다.

이 모듈의 책임 (Gateway):
    - 원격 페치 (전체 약 25MB, 1회)
    - 3단 캐시: 메모리 → 디스크 → 원격
    - 에셋 경로 → 실제 이미지 URL 변환
    - 실패 격리 — 상위 계층에 예외를 전파하지 않는다

이 모듈이 하지 않는 것:
    도메인 모델 변환·필터링은 static_data.py 의 책임이다.
    (riot_live.py 가 HTTP·캐시·변환을 모두 안고 416줄이 된 전철을 피하기 위한 분리다.)

설계 문서: aidlc-docs/construction/U1/functional-design/
"""
from __future__ import annotations

import json
import os
import threading
import time

import requests

_HERE = os.path.dirname(__file__)
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))

# 한국어 전체 데이터. 챔피언 traits 와 아이템 composition 이 여기에 들어 있다.
CDRAGON_URL = "https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json"
# 에셋 경로(ASSETS/...) 앞에 붙는 베이스. 소문자 + .tex/.dds → .png 규칙과 함께 쓴다.
ASSET_BASE = "https://raw.communitydragon.org/latest/game/"

DEFAULT_SET = "17"
CACHE_TTL_SECONDS = 24 * 60 * 60  # BR-6.2 — CDragon 은 패치(2주) 주기로 갱신된다
_FETCH_TIMEOUT = 60  # 25MB 다운로드

_EMPTY: dict = {"setNumber": "", "champions": [], "traits": [], "items": [], "fetchedAt": 0.0}

_memory_cache: dict | None = None
_lock = threading.Lock()


# ── 설정 ──────────────────────────────────────────────────────────
def set_number() -> str:
    """대상 세트 번호. 환경변수 TFT_SET, 미설정 시 DEFAULT_SET. (BR-5)"""
    return (os.environ.get("TFT_SET") or DEFAULT_SET).strip()


def _cache_path(set_no: str) -> str:
    return os.path.join(_ROOT, "data", "cache", f"cdragon_set{set_no}.json")


# ── 에셋 URL 변환 (BR-4) ──────────────────────────────────────────
def asset_url(path: str | None) -> str | None:
    """CDragon 에셋 경로를 실제 이미지 URL 로 변환.

    'ASSETS/Characters/TFT17_Briar/HUD/TFT17_Briar_Square.tex'
      → 'https://raw.communitydragon.org/latest/game/assets/characters/tft17_briar/hud/tft17_briar_square.png'

    규칙: 소문자화 → .tex/.dds 를 .png 로 → 베이스 URL 결합.
    4개 패턴(챔피언 스플래시/타일, 특성, 아이템)에 대해 HTTP 200 을 실측 확인했다.

    URL 의 도달 가능성은 검증하지 않는다. 검증하면 목록 조회마다 수십~수백 건의
    HTTP 요청이 발생한다. 깨진 URL 은 프론트 IconImage 의 이니셜 폴백이 흡수한다.
    """
    if not path:
        return None
    lowered = path.lower()
    for ext in (".tex", ".dds"):
        if lowered.endswith(ext):
            lowered = lowered[: -len(ext)] + ".png"
            break
    return ASSET_BASE + lowered.lstrip("/")


# ── 캐시 계층 (BR-6) ──────────────────────────────────────────────
def _extract(payload: dict, set_no: str) -> dict:
    """전체 페이로드에서 현재 세트에 필요한 부분만 추출한다. 25MB → 수백 KB.

    아이템은 세트별로 분리되어 있지 않고 단일 전역 배열이다.
    세트 구분은 apiName 접두사로 이루어지며 static_data.py 가 처리한다.
    """
    set_data = (payload.get("sets") or {}).get(set_no)
    if not isinstance(set_data, dict):
        # 요청한 세트가 없다 → 빈 데이터로 degrade (BR-5 규칙 3)
        return dict(_EMPTY, setNumber=set_no, fetchedAt=time.time())
    return {
        "setNumber": set_no,
        "champions": set_data.get("champions") or [],
        "traits": set_data.get("traits") or [],  # 현재 미사용, 특성 아이콘 확장 대비
        "items": payload.get("items") or [],
        "fetchedAt": time.time(),
    }


def _read_disk(set_no: str) -> dict | None:
    """디스크 캐시를 읽는다. 부재·손상·만료면 None. (BR-6.2)"""
    path = _cache_path(set_no)
    try:
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return None
        if time.time() - float(data.get("fetchedAt") or 0) >= CACHE_TTL_SECONDS:
            return None  # 만료 → 재페치
        return data
    except (OSError, ValueError, TypeError):
        return None  # 손상된 캐시는 조용히 무시하고 재페치한다


def _write_disk(set_no: str, data: dict) -> None:
    """디스크 캐시를 기록한다. 실패해도 오류로 취급하지 않는다. (BR-6.4)"""
    path = _cache_path(set_no)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        os.replace(tmp, path)  # 부분 기록된 파일이 읽히지 않도록 원자적 교체
    except (OSError, ValueError, TypeError):
        pass  # 메모리 캐시만으로도 정상 동작한다


def _fetch_remote(set_no: str) -> dict:
    """Community Dragon 원격 페치 후 추출. 실패 시 빈 구조. (BR-7)"""
    try:
        resp = requests.get(CDRAGON_URL, timeout=_FETCH_TIMEOUT)
        if resp.status_code != 200:
            return dict(_EMPTY, setNumber=set_no)
        return _extract(resp.json(), set_no)
    except (requests.RequestException, ValueError):
        return dict(_EMPTY, setNumber=set_no)


def _snapshot() -> dict:
    """스냅샷 확보. 메모리 → 디스크 → 원격 순. (BR-6.1)

    어떤 단계에서 실패해도 예외를 던지지 않고 빈 구조를 돌려준다.
    """
    global _memory_cache
    set_no = set_number()

    with _lock:
        if _memory_cache is not None and _memory_cache.get("setNumber") == set_no:
            return _memory_cache

    data = _read_disk(set_no)
    if data is None:
        data = _fetch_remote(set_no)
        if data.get("champions") or data.get("items"):
            _write_disk(set_no, data)  # 빈 결과는 캐시하지 않는다

    with _lock:
        _memory_cache = data
    return data


def reset_cache() -> None:
    """메모리 캐시를 비운다. 테스트와 수동 갱신용."""
    global _memory_cache
    with _lock:
        _memory_cache = None


# ── 공개 인터페이스 ───────────────────────────────────────────────
def champions_raw() -> list[dict]:
    """현재 세트의 CDragon 원본 챔피언 목록. 실패 시 []."""
    return _snapshot().get("champions") or []


def traits_raw() -> list[dict]:
    """현재 세트의 CDragon 원본 특성 목록. 실패 시 [].

    현재 소비처가 없다. 특성 아이콘이 필요해질 때의 확장 지점으로 남겨 둔다
    (UQ1-C 로 이번 범위에서는 특성을 이름 문자열로만 다루기로 했다).
    """
    return _snapshot().get("traits") or []


def items_raw() -> list[dict]:
    """CDragon 원본 아이템 목록(전 세트 공통). 실패 시 []."""
    return _snapshot().get("items") or []
