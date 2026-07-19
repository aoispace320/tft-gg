"""전처리 — raw 매치 JSONL → ML 학습용 표(CSV) 두 종류로 정리.

산출물(data/processed/):
  1) tft_participants.csv  — 사람이 읽는 형태(한 행 = 한 판의 한 플레이어), 유닛/특성/증강 이름 디코딩
  2) tft_features.csv       — ML용 멀티핫 인코딩(유닛/특성) + 숫자 피처 + placement(정답 라벨)

'전처리만' 이 목표이므로 모델 학습은 하지 않는다. 여기 나온 CSV를 그대로 학습에 쓰면 된다.
"""
import json
import os

import pandas as pd

from ..collector.ddragon import DDragon

RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "tft_matches.jsonl")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

# 랭크(솔로) TFT 큐 id. 기본적으로 랭크만 남긴다.
RANKED_QUEUE = 1100


def _iter_matches(path: str):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def _flatten(dd: DDragon, ranked_only: bool = True) -> list[dict]:
    rows = []
    for match in _iter_matches(RAW_PATH):
        info = match.get("info", {})
        queue_id = info.get("queue_id") or info.get("queueId")
        if ranked_only and queue_id != RANKED_QUEUE:
            continue
        meta = {
            "match_id": match.get("metadata", {}).get("match_id"),
            "patch": info.get("game_version"),
            "set": info.get("tft_set_number"),
            "queue_id": queue_id,
            "game_datetime": info.get("game_datetime"),
        }
        for p in info.get("participants", []):
            # 소환수/PVE 몬스터는 플레이어가 배치한 유닛이 아니라 노이즈 → 제외
            units = [
                u for u in p.get("units", [])
                if u.get("character_id") and "Summon" not in u["character_id"] and "PVE" not in u["character_id"]
            ]
            unit_ids = [u["character_id"] for u in units]
            unit_readable = [
                f"{dd.champ(u.get('character_id'))}(★{u.get('tier', 1)})" for u in units if u.get("character_id")
            ]
            # 아이템: 신버전은 itemNames(문자열), 구버전은 items(정수)
            item_ids = []
            for u in units:
                item_ids.extend(u.get("itemNames") or [])
            item_readable = [dd.item(i) for i in item_ids]

            traits = [t for t in p.get("traits", []) if t.get("tier_current", 0) > 0]
            trait_ids = [t.get("name") for t in traits if t.get("name")]
            trait_readable = [f"{dd.trait(t.get('name'))}({t.get('num_units')})" for t in traits]

            augment_ids = p.get("augments", []) or []
            augment_readable = [dd.augment(a) for a in augment_ids]

            rows.append(
                {
                    **meta,
                    "puuid": p.get("puuid"),
                    "placement": p.get("placement"),
                    "level": p.get("level"),
                    "last_round": p.get("last_round"),
                    "players_eliminated": p.get("players_eliminated"),
                    "total_damage_to_players": p.get("total_damage_to_players"),
                    "gold_left": p.get("gold_left"),
                    "win": p.get("win"),
                    "num_units": len(unit_ids),
                    "units": json.dumps(unit_readable, ensure_ascii=False),
                    "traits": json.dumps(trait_readable, ensure_ascii=False),
                    "items": json.dumps(item_readable, ensure_ascii=False),
                    "augments": json.dumps(augment_readable, ensure_ascii=False),
                    # 피처 인코딩용(ID 리스트는 내부 컬럼)
                    "_unit_ids": unit_ids,
                    "_trait_ids": trait_ids,
                }
            )
    return rows


def _multi_hot(df: pd.DataFrame, list_col: str, prefix: str) -> pd.DataFrame:
    """리스트 컬럼 → 멀티핫(0/1) 컬럼들."""
    vocab = sorted({x for lst in df[list_col] for x in lst})
    data = {f"{prefix}{v}": df[list_col].apply(lambda lst: int(v in lst)) for v in vocab}
    return pd.DataFrame(data, index=df.index)


def preprocess(ranked_only: bool = True) -> tuple[str, str]:
    os.makedirs(OUT_DIR, exist_ok=True)
    print("DDragon 사전 로드 중...")
    dd = DDragon()

    print(f"raw 매치 평탄화 중... (랭크만={ranked_only})")
    rows = _flatten(dd, ranked_only=ranked_only)
    if not rows:
        raise RuntimeError("전처리할 참가자 행이 없습니다. 먼저 수집(collect)을 실행하세요.")
    df = pd.DataFrame(rows)
    print(f"      → 참가자 행 {len(df)}개 (매치 {df['match_id'].nunique()}개)")

    # 1) 사람이 읽는 CSV
    readable = df.drop(columns=["_unit_ids", "_trait_ids"])
    readable_path = os.path.join(OUT_DIR, "tft_participants.csv")
    readable.to_csv(readable_path, index=False, encoding="utf-8-sig")

    # 2) ML용 멀티핫 + 숫자 피처
    numeric = df[
        ["placement", "level", "last_round", "players_eliminated", "total_damage_to_players", "gold_left", "num_units"]
    ].copy()
    unit_oh = _multi_hot(df, "_unit_ids", "unit_")
    trait_oh = _multi_hot(df, "_trait_ids", "trait_")
    features = pd.concat([numeric, unit_oh, trait_oh], axis=1)
    features_path = os.path.join(OUT_DIR, "tft_features.csv")
    features.to_csv(features_path, index=False, encoding="utf-8-sig")

    print(f"완료:\n  · 읽기용  {readable_path}  ({readable.shape[0]}행 {readable.shape[1]}열)")
    print(f"  · 학습용  {features_path}  ({features.shape[0]}행 {features.shape[1]}열: 유닛 {unit_oh.shape[1]} + 특성 {trait_oh.shape[1]} + 숫자 {numeric.shape[1]})")
    return readable_path, features_path
