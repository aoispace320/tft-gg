"""매치 데이터 수집 — 상위 티어(챌린저/그마/마스터) 유저 → 최근 매치 → 상세를 raw JSONL로.

여러 티어를 섞을 수 있다. 티어별 상위 N명씩 뽑아 puuid를 합치고 중복 제거.
결과: data/raw/tft_matches.jsonl (한 줄 = 매치 1개 전체 JSON)
"""
import json
import os

from .riot_client import RiotClient

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")
RAW_PATH = os.path.join(RAW_DIR, "tft_matches.jsonl")


def collect(
    players_per_tier: int = 15,
    matches_per_player: int = 20,
    tiers: tuple[str, ...] = ("challenger", "grandmaster", "master"),
    max_matches: int | None = None,
) -> str:
    client = RiotClient()
    os.makedirs(RAW_DIR, exist_ok=True)

    print(f"[1/3] 티어 {list(tiers)} 각 상위 {players_per_tier}명 조회")
    puuids: list[str] = []
    seen: set[str] = set()
    for tier in tiers:
        league = client.league_top(tier)
        if not league:
            print(f"      · {tier} 조회 실패 — 건너뜀 (키 만료/권한 확인)")
            continue
        entries = sorted(league.get("entries", []), key=lambda e: e.get("leaguePoints", 0), reverse=True)
        added = 0
        for e in entries[:players_per_tier]:
            p = e.get("puuid")
            if p and p not in seen:
                seen.add(p)
                puuids.append(p)
                added += 1
        print(f"      · {tier}: {added}명 추가 (누적 {len(puuids)})")

    if not puuids:
        raise RuntimeError("유저를 한 명도 못 모았습니다 — API 키 만료/권한 확인.")

    print(f"[2/3] 유저 {len(puuids)}명의 최근 매치 ID 수집(각 {matches_per_player}판)")
    match_ids: set[str] = set()
    for i, puuid in enumerate(puuids, 1):
        ids = client.match_ids_by_puuid(puuid, count=matches_per_player) or []
        match_ids.update(ids)
        if i % 10 == 0 or i == len(puuids):
            print(f"      · {i}/{len(puuids)} 유저 → 누적 고유 매치 {len(match_ids)}개")
    match_ids = list(match_ids)
    if max_matches is not None and len(match_ids) > max_matches:
        match_ids = match_ids[:max_matches]
        print(f"      · 상한 적용 → 매치 {len(match_ids)}개만 수집")

    print(f"[3/3] 매치 상세 {len(match_ids)}개 수집 → {RAW_PATH}")
    saved = 0
    with open(RAW_PATH, "w", encoding="utf-8") as f:
        for i, mid in enumerate(match_ids, 1):
            detail = client.match_detail(mid)
            if not detail:
                continue
            f.write(json.dumps(detail, ensure_ascii=False) + "\n")
            saved += 1
            if i % 20 == 0 or i == len(match_ids):
                print(f"      · {i}/{len(match_ids)} 진행(저장 {saved})")

    print(f"완료: 매치 {saved}개 저장 → {RAW_PATH}")
    return RAW_PATH
