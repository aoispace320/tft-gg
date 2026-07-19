"""Riot TFT API 클라이언트 — 레이트리밋 대기 + 429 재시도 처리.

개발용(dev) API 키 한도: 초당 20회 / 2분당 100회.
2분당 100회가 더 빡빡하므로(=초당 약 0.83회) 요청마다 약간 쉬어서 한도를 넘지 않게 한다.
"""
import os
import time

import requests
import dotenv

dotenv.load_dotenv()

# 대륙(continent) 라우팅 — account, match API 용
CONTINENT_HOST = "asia.api.riotgames.com"
# 플랫폼(platform) 라우팅 — league, summoner API 용 (한국 서버)
PLATFORM_HOST = "kr.api.riotgames.com"

# 2분당 100회 한도를 안전하게 지키기 위한 요청 간 최소 간격(초).
_MIN_INTERVAL = 1.3


class RiotClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("riot_api_key")
        if not self.api_key:
            raise RuntimeError(".env 의 riot_api_key 를 찾을 수 없습니다.")
        self.session = requests.Session()
        self.session.headers.update({"X-Riot-Token": self.api_key})
        self._last_call = 0.0

    def _throttle(self):
        elapsed = time.time() - self._last_call
        if elapsed < _MIN_INTERVAL:
            time.sleep(_MIN_INTERVAL - elapsed)

    def get(self, url: str, params: dict | None = None, max_retries: int = 5):
        """레이트리밋을 지키며 GET. 429는 Retry-After 만큼 쉬고 재시도."""
        for attempt in range(max_retries):
            self._throttle()
            resp = self.session.get(url, params=params, timeout=15)
            self._last_call = time.time()

            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", "5"))
                print(f"  · 레이트리밋(429) — {retry_after}초 대기 후 재시도")
                time.sleep(retry_after + 1)
                continue
            if resp.status_code in (500, 502, 503, 504):
                print(f"  · 서버 오류({resp.status_code}) — 3초 후 재시도")
                time.sleep(3)
                continue
            # 그 외(400/401/403/404 등)는 재시도 의미 없음
            print(f"  · 요청 실패 {resp.status_code}: {url}")
            return None
        print(f"  · 재시도 {max_retries}회 초과: {url}")
        return None

    # ── TFT 엔드포인트 ────────────────────────────────────────────
    def league_top(self, tier: str = "challenger") -> dict | None:
        """챌린저/그랜드마스터/마스터 리그 전체 조회. entries[*].puuid 포함."""
        tier = tier.lower()
        assert tier in ("challenger", "grandmaster", "master")
        url = f"https://{PLATFORM_HOST}/tft/league/v1/{tier}"
        return self.get(url)

    def match_ids_by_puuid(self, puuid: str, count: int = 20) -> list[str] | None:
        url = f"https://{CONTINENT_HOST}/tft/match/v1/matches/by-puuid/{puuid}/ids"
        return self.get(url, params={"count": count})

    def match_detail(self, match_id: str) -> dict | None:
        url = f"https://{CONTINENT_HOST}/tft/match/v1/matches/{match_id}"
        return self.get(url)
