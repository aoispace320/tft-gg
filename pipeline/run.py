"""TFT 데이터 파이프라인 실행 진입점.

사용 예:
  python -m pipeline.run                       # 기본: 챌린저 15명 × 20판 수집 후 전처리
  python -m pipeline.run --players 5 --matches 5   # 소규모 테스트
  python -m pipeline.run --skip-collect         # 이미 수집한 raw로 전처리만
  python -m pipeline.run --tier grandmaster     # 그랜드마스터 대상

'전처리만' 이 목표이므로 모델 학습은 하지 않는다. 산출물은 data/processed/*.csv.
"""
import argparse

from .collector.collect import collect
from .processor.preprocess import preprocess


def main():
    ap = argparse.ArgumentParser(description="TFT 데이터 수집 + 전처리 파이프라인")
    ap.add_argument("--players", type=int, default=15, help="티어별 상위 유저 수(기본 15)")
    ap.add_argument("--matches", type=int, default=20, help="유저당 최근 매치 수(기본 20)")
    ap.add_argument(
        "--tiers", nargs="+", default=["challenger", "grandmaster", "master"],
        choices=["challenger", "grandmaster", "master"], help="섞을 티어(기본 3개 모두)",
    )
    ap.add_argument("--skip-collect", action="store_true", help="수집 건너뛰고 전처리만")
    ap.add_argument("--all-queues", action="store_true", help="랭크 외 모드도 포함(기본은 랭크만)")
    ap.add_argument("--max-matches", type=int, default=None, help="수집할 매치 상한(예상 시간 조절용)")
    args = ap.parse_args()

    if not args.skip_collect:
        collect(
            players_per_tier=args.players,
            matches_per_player=args.matches,
            tiers=tuple(args.tiers),
            max_matches=args.max_matches,
        )
    else:
        print("수집 건너뜀 — 기존 raw 사용")

    preprocess(ranked_only=not args.all_queues)


if __name__ == "__main__":
    main()
