# TFT 데이터 파이프라인 (수집 + 전처리)

Riot TFT API로 매치 데이터를 모아 → DDragon으로 이름을 붙이고 → **AI 학습용 표(CSV)로 전처리**한다.
모델 학습은 하지 않는다(전처리까지가 목표). 산출물은 `data/processed/`.

## 구성
```
pipeline/
  collector/
    riot_client.py   Riot API 클라이언트 (레이트리밋·429 재시도)
    ddragon.py       DDragon 정적데이터 → ID→한글이름 디코더 (data/ddragon/ 캐시)
    collect.py       상위티어 유저 → 최근 매치 → 상세 수집 → data/raw/tft_matches.jsonl
  processor/
    preprocess.py    raw → 참가자 단위 평탄화·디코딩·멀티핫 인코딩
  run.py             진입점 (수집 → 전처리)
```

## 사전 준비
- 저장소 루트 `.env` 에 `riot_api_key = 'RGAPI-...'`
  - ⚠️ **개발용 키는 24시간마다 만료** → 401 뜨면 https://developer.riotgames.com 에서 재발급 후 `.env` 갱신.

## 실행
```bash
# 기본: 챌린저+그마+마스터 각 15명 × 각 20판, 랭크만 수집 후 전처리
python -m pipeline.run

# 소규모 테스트
python -m pipeline.run --players 3 --matches 5

# 이미 수집한 raw로 전처리만
python -m pipeline.run --skip-collect

# 특정 티어만 / 랭크 외 모드도 포함
python -m pipeline.run --tiers challenger --all-queues
```

## DDragon 소스 (ID→이름 디코딩)
- **로컬 미러 우선**: `data/TFT_DDragon/`(noxelisdev/TFT_DDragon) 가 있으면 그걸 사용(오프라인·완전, 증강 카탈로그 포함).
  - 받기: `git clone --depth 1 https://github.com/noxelisdev/TFT_DDragon.git data/TFT_DDragon`
- 미러가 없으면 **공식 DDragon CDN** 으로 자동 폴백.
- 소환수(`*Summon*`)·PVE 몬스터(`*PVE*`)는 플레이어 유닛이 아니므로 전처리에서 제외.

## 산출물 (data/processed/)
- **tft_participants.csv** — 사람이 읽는 형태. 한 행 = 한 판의 한 플레이어.
  주요 컬럼: `placement`(등수), `level`, `gold_left`, `win`, `units`(유닛+성급), `traits`(특성+인원), `items`, `patch`, `queue_id`
- **tft_features.csv** — ML 학습용. `placement`(정답 라벨) + 숫자 피처 + 유닛/특성 **멀티핫(0/1)** 인코딩.

## 참고
- `data/` 는 `.gitignore` 로 커밋 제외(용량 큼).
- 더블업(queue 1150/1160)은 팀전이라 기본 제외.
- 현재 세트(Set 17) 매치에는 `augments` 필드가 없어 해당 컬럼은 비어 있음(구조는 유지, 향후 세트 대비).
- 레이트리밋 때문에 규모가 곧 소요시간(요청당 ~1.3초). 15×20 ≈ 수 분.
