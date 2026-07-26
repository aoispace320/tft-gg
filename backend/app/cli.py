"""커밋 f48fe45 프로토타입의 콘솔 출력을 그대로 재현하는 CLI.

당시엔 이 코드가 backend/app/main.py 에 통째로 들어 있었지만, import 시점에 input() 이
실행되는 구조라 FastAPI 서버와 공존할 수 없었다. 로직은 services/riot_live.py 로 옮기고,
'입력받아 출력하는' 부분만 여기에 남겼다.

실행: backend 폴더에서  python -m app.cli
"""
from .services import riot_live
from .services.riot_live import RiotError

REGION = "kr"


def main() -> None:
    riot_id = input("검색하고 싶은 소환사명을 입력해주세요. : ")
    game_name, tag_line = riot_live.split_riot_id(riot_id, REGION)

    print(f"--- {game_name}#{tag_line} 님의 TFT 전적 검색 시작 ---")

    try:
        account = riot_live.account_by_riot_id(game_name, tag_line, REGION)
    except RiotError as e:
        print(f"계정 조회 실패: {e.message}")
        return
    puuid = account.get("puuid")

    # 소환사 레벨
    try:
        summoner = riot_live.summoner_by_puuid(puuid, REGION)
        print(f"소환사 레벨: {summoner.get('summonerLevel')}")
    except RiotError as e:
        print(f"소환사 조회 실패: {e.message}")

    # 최근 매치 5판의 모드 + 등수
    try:
        ids = riot_live.match_ids(puuid, REGION, count=5)
    except RiotError as e:
        print(f"매치 목록 조회 실패: {e.message}")
        return
    print(f"가져온 매치 ID 개수: {len(ids)}개")

    for idx, match_id in enumerate(ids, start=1):
        try:
            detail = riot_live.match_detail(match_id, REGION)
        except RiotError:
            continue
        info = detail.get("info", {})
        queue_id = info.get("queue_id")
        mode_name = riot_live.QUEUE_NAMES.get(queue_id, "기타 모드")

        me = next((p for p in info.get("participants", []) if p.get("puuid") == puuid), None)
        if me is not None:
            print(f"  [{idx}] [{mode_name}] 최근 {idx}번째 게임 결과: {me.get('placement')}등")
        else:
            print(f"  [{idx}] 이 매치에서는 유저를 찾을 수 없습니다.")

    # 큐 타입별 티어
    try:
        entries = riot_live.league_by_puuid(puuid, REGION)
    except RiotError as e:
        print(f"랭크 조회 실패: {e.message}")
        return

    if not entries:
        print(f"{riot_id}님의 랭크 기록이 없습니다.")
    else:
        for data in entries:
            queue_type = data.get("queueType")
            wins, losses = data.get("wins", 0), data.get("losses", 0)
            total = wins + losses
            top_4_rate = (wins / total * 100) if total else 0.0
            lp = data.get("leaguePoints")
            tier, rank = data.get("tier"), data.get("rank")

            if queue_type == "RANKED_TFT":
                print(f"[솔로랭크] {riot_id}님은 {tier} {rank}, {lp}LP ({wins}승 {losses}패)로 TOP 4 비율은 {top_4_rate:.2f}%")
            elif queue_type == "RANKED_TFT_DOUBLE_UP":
                print(f"[더블업] {riot_id}님은 {tier} {rank}, {lp}LP ({wins}승 {losses}패)로, TOP 4 비율은 {top_4_rate:.2f}%")
            elif queue_type == "RANKED_TFT_TURBO":
                rated_tier = data.get("ratedTier")
                rated_rating = data.get("ratedRating")
                print(f"[하이퍼롤] {riot_id}님은 {rated_tier} 티어, {rated_rating}점 ({wins}승 {losses}패)로 TOP 4 비율은 {top_4_rate:.2f}%")

    # 한국 서버 챌린저 상위 10명
    try:
        board = riot_live.leaderboard(region=REGION, tier="challenger", page=1, page_size=10)
    except RiotError as e:
        print(f"랭킹 조회 실패: {e.message}")
        return

    for row in board["rows"]:
        print(f"한국 서버 {row['rank']}등: {row['name']}")


if __name__ == "__main__":
    main()
