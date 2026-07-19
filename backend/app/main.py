import requests
import urllib
import json
import datetime
import time
import dotenv
import os
import pandas as pd
import numpy as np

dotenv.load_dotenv()

headers = {
    "X-Riot-Token": os.environ.get('riot_api_key')
}

'''
base_host = 'asia.api.riotgames.com'

gameName = 'Hide on bush'
tagLine = 'KR1'
gameName = gameName.replace(' ','%20')
account_v1 = f'https://{base_host}/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}'

#request_tft_url = f'https://{base_host}/tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}'

today = datetime.datetime.today()

year = today.year
month = today.month
day = today.day
hour = today.hour

res = urllib.request.Request(account_v1)

for key,value in headers.items() : 
    res.add_header(key, value)
response = urllib.request.urlopen(res)
result = response.readlines()

result = json.loads(result[0].decode('utf-8'))

print('Status Code : ',response.getcode())

user_puuid = result.get('puuid')
user_name = result.get('gameName')
user_tag = result.get('tagLine')

print(f'{year}년 {month}월 {day}일 {hour}시 기준\n{user_name}님은 {user_tag}태그입니다.')

base_host = 'kr.api.riotgames.com'
tft_url = f'https://{base_host}/tft/summoner/v1/summoners/by-puuid/{user_puuid}'

res = urllib.request.Request(tft_url)

for key,value in headers.items() : 
    res.add_header(key, value)
response = urllib.request.urlopen(res)
result = response.readlines()

result = json.loads(result[0].decode('utf-8'))

print('Status Code : ',response.getcode())

user_puuid = result.get('puuid')
user_icon = result.get('profileIconId')
user_date_ms = result.get('revisionDate')
user_date = datetime.datetime.fromtimestamp(user_date_ms / 1000).strftime('%Y-%m-%d %H:%M:%S')
user_level = result.get('summonerLevel')
print(f'{year}년 {month}월 {day}일 {hour}시 기준\n{user_name}님의 아이콘은 {user_icon}이고, 최근 수정한 날짜는 {user_date}이고, 소환사의 레벨은 {user_level}')
'''

riot_id = input("검색하고 싶은 소환사명을 입력해주세요. : ")
parts = riot_id.split('#')

gameName = parts[0]
tagLine = parts[1]

print(f"--- {gameName}#{tagLine} 님의 TFT 전적 검색 시작 ---")
account_url = f"https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}"
account_res = requests.get(account_url, headers=headers)
if account_res.status_code != 200:
    print(f"계정 조회 실패 (상태 코드: {account_res.status_code})")
    exit()
account_data = account_res.json()
puuid = account_data.get("puuid")


summoner_url = f"https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/{puuid}"
summoner_res = requests.get(summoner_url, headers=headers)
if summoner_res.status_code == 200:
    summoner_data = summoner_res.json()
    print(f"소환사 레벨: {summoner_data.get('summonerLevel')}")


match_list_url = f"https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/{puuid}/ids?count=5"
match_list_res = requests.get(match_list_url, headers=headers)
if match_list_res.status_code != 200:
    print(f"매치 목록 조회 실패 (상태 코드: {match_list_res.status_code})")
    exit()
match_ids = match_list_res.json()  # 예: ['KR_xxxxxxxxxx', 'KR_yyyyyyyyyy', ...]
print(f"가져온 매치 ID 개수: {len(match_ids)}개")


for idx, match_id in enumerate(match_ids, start=1):
    detail_url = f"https://asia.api.riotgames.com/tft/match/v1/matches/{match_id}"
    detail_res = requests.get(detail_url, headers=headers)
    
    if detail_res.status_code != 200:
         continue
         
    match_detail = detail_res.json()
    
    queue_id = match_detail.get("info", {}).get("queue_id")
    
    mode_name = "기타 모드"
    if queue_id == 1160 or queue_id == 1150:
        mode_name = "더블업 모드"
    elif queue_id == 1100:
        mode_name = "랭크 게임"
    elif queue_id == 1090:
        mode_name = "일반 게임"
    elif queue_id == 1130:
        mode_name = "초고속 모드"

    participants = match_detail.get("info", {}).get("participants", [])
    my_placement = None
    for player in participants:
        if player.get("puuid") == puuid:
            my_placement = player.get("placement")
            break

    if my_placement is not None:
        print(f"  [{idx}] [{mode_name}] 최근 {idx}번째 게임 결과: {my_placement}등")
    else:
        print(f"  [{idx}] 이 매치에서는 유저를 찾을 수 없습니다.")

tier_url = f"https://kr.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
tier_res = requests.get(tier_url, headers=headers)

if tier_res.status_code != 200 :
    print(f'요청이 제대로 되지 않았습니다. 오류 코드 : {tier_res.status_code}')
    exit()

user_tft_league_data = tier_res.json()

'''for entry in user_tft_league_data :
    print(entry.get('queueType'))
출력 예시 : [{"puuid":"cbiztZn7SpeQbCpkxvAYZigc7-XVtPqpVCN9pMy4J-Rtb1B-vcextkYvRl4pKgK6oAlKN9plfW3pPQ","queueType":"RANKED_TFT_DOUBLE_UP","tier":"GOLD","rank":"IV","leaguePoints":79,"wins":9,"losses":0,"veteran":false,"inactive":false,"freshBlood":false,"hotStreak":true},{"puuid":"cbiztZn7SpeQbCpkxvAYZigc7-XVtPqpVCN9pMy4J-Rtb1B-vcextkYvRl4pKgK6oAlKN9plfW3pPQ","queueType":"RANKED_TFT","tier":"CHALLENGER","rank":"I","leaguePoints":1715,"wins":289,"losses":175,"veteran":true,"inactive":false,"freshBlood":false,"hotStreak":true}]'''

if not user_tft_league_data :
    print(f'{riot_id}님의 랭크 기록이 없습니다.')
    
else :
    for data in user_tft_league_data :
        queueType = data.get('queueType')
        wins = data.get('wins')
        losses = data.get('losses')

        if queueType == 'RANKED_TFT' :
            rank = data.get('rank')
            tier = data.get('tier')
            leaguePoints = data.get('leaguePoints')
            top_4_rate = wins / (wins + losses) * 100
            print(f'[솔로랭크] {riot_id}님은 {tier} {rank}, {leaguePoints}LP ({wins}승 {losses}패)로 TOP 4 비율은 {top_4_rate:.2f}%')
            
        elif queueType == 'RANKED_TFT_DOUBLE_UP' :
            rank = data.get('rank')
            tier = data.get('tier')
            leaguePoints = data.get('leaguePoints')
            top_4_rate = wins / (wins + losses) * 100
            print(f'[더블업] {riot_id}님은 {tier} {rank}, {leaguePoints}LP ({wins}승 {losses}패)로, TOP 4 비율은 {top_4_rate:.2f}%')

        elif queueType == 'RANKED_TFT_TURBO' :
            ratedTier = data.get('ratedTier')
            ratedRating = data.get('ratedRating')
            top_4_rate = wins / (wins + losses) * 100
            print(f'[하이퍼롤] {riot_id}님은 {ratedTier} 티어, {ratedRating}점 ({wins}승 {losses}패)로 TOP 4 비율은 {top_4_rate:.2f}%')


challenger_url = 'https://kr.api.riotgames.com/tft/league/v1/challenger'
challenger_res = requests.get(challenger_url, headers = headers)

challenger_data = challenger_res.json()

entry = challenger_data.get('entries')

top10 = sorted(entry, key=lambda x : x.get('leaguePoints', 0), reverse=True)[:10]


for idx, player in enumerate(top10, start = 1) :
    puuid = player.get('puuid')
    lp = player.get('leaguePoints')
    wins = player.get('wins')
    losses = player.get('losses')
    rank = player.get('rank')

    summoner_name = f"https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/{puuid}"
    summoner_res = requests.get(summoner_name, headers=headers)
    if summoner_res.status_code == 200:
        summoner_data = summoner_res.json()
        print(f"한국 서버 {idx}등: {summoner_data.get('gameName')}#{summoner_data.get('tagLine')}")
