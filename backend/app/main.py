import requests
import urllib
import json
import datetime
import time
import dotenv
import os

dotenv.load_dotenv('C:/Users/samgj/Desktop/tfg_gg/.env')
dotenv_file = dotenv.find_dotenv()
dotenv.load_dotenv(dotenv_file)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://developer.riotgames.com",
    "X-Riot-Token": os.environ.get('riot_api_key')
}

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
user_date = result.get('revisionDate')
user_level = result.get('summonerLevel')
print(f'{year}년 {month}월 {day}일 {hour}시 기준\n{user_name}님의 아이콘은 {user_icon}이고, 최근 수정한 날짜는 {user_date}이고, 소환사의 레벨은 {user_level}')
