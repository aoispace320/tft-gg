# U1 Implementation Summary — 백엔드 정적 데이터 소스 교체

**완료일**: 2026-08-04

---

## 파일 변경

| 파일 | 유형 | 내용 |
|---|---|---|
| `backend/app/services/cdragon.py` | **생성** | Community Dragon 게이트웨이 — 3단 캐시, 에셋 URL 변환, 실패 격리 |
| `backend/app/services/static_data.py` | **수정 (제자리)** | DDragon 미러 제거, CDragon 기반 도메인 조립기로 재작성 |
| `backend/requirements.txt` | 수정 | `pandas`(누락 보완), `pytest` 추가 |
| `.env.example` | 수정 | `TFT_SET` 문서화 |
| `backend/tests/__init__.py` | 생성 | |
| `backend/tests/conftest.py` | 생성 | 샘플 스냅샷 픽스처 |
| `backend/tests/test_cdragon.py` | 생성 | 20개 테스트 |
| `backend/tests/test_static_data.py` | 생성 | 22개 테스트 |

**중복 파일 없음** — 기존 `static_data.py` 를 제자리 수정했다.

---

## 검증 결과 (실측)

### 데이터

| 항목 | 설계 예측 | **실측** | 일치 |
|---|---|---|---|
| 챔피언 | 약 63 | **63** | ✅ |
| 챔피언 중 `traits` 보유 | 전원 | **63 / 63** | ✅ |
| 조합 아이템 | 65 | **65** | ✅ |
| 기본 재료 | 10 | **10** | ✅ |
| 아이템 총계 | 75 | **75** | ✅ |
| 참조 무결성 위반 | 0 | **0** | ✅ |

### API 응답 실례

```json
// GET /api/champions  → 200, 63건
{ "id": "TFT17_Nasus", "name": "나서스", "cost": 1,
  "traits": ["우주 그루브", "선봉대"],
  "iconUrl": "https://raw.communitydragon.org/latest/game/assets/characters/tft17_nasus/hud/tft17_nasus_square.png" }

// GET /api/items  → 200, 75건
{ "id": "TFT17_Item_DRXEmblemItem", "name": "N.O.V.A. 상징", "type": "combined",
  "recipe": ["TFT_Item_Spatula", "TFT_Item_SparringGloves"] }
{ "id": "TFT_Item_BFSword", "name": "B.F. 대검", "type": "component", "recipe": null }
```

**이전 상태와 비교**: `traits` 가 항상 `[]`, 모든 아이템이 `combined`, `recipe` 없음, `iconUrl` 없음 → 전부 해소.

### 실패 모드

| 시나리오 | 결과 |
|---|---|
| 디스크 캐시 히트 (네트워크 차단) | champions=63, items=75, **0.020초** |
| 캐시 없음 + 네트워크 차단 | champions=0, items=0 — **예외 없음, 500 아님** |
| 네트워크 복구 후 | champions=63 정상 복구 |

### 테스트

```
backend/ $ python -m pytest tests/ -q
42 passed in 0.09s
```

---

## 설계 대비 정정 1건

| 항목 | 설계 문서 | 실제 |
|---|---|---|
| 디스크 캐시 크기 | "수백 KB" | **2.1MB** |

원인: 아이템 배열이 세트별로 분리되지 않은 전역 3,680건이라 그대로 보관된다.
25MB → 2.1MB 로 **약 12배 축소**되었고 읽기가 0.02초라 실사용에 문제가 없어 그대로 둔다.

더 줄이려면 Gateway 가 아이템을 미리 걸러야 하는데, 그것은 도메인 규칙(BR-2)이므로
Gateway 에 두면 계층 분리가 깨진다. 현 구조를 유지하는 편이 옳다.

---

## 요구사항 충족

| FR/NFR | 상태 |
|---|---|
| FR-1.1' Community Dragon 소스 | ✅ |
| FR-3.1 챔피언 traits | ✅ 63/63 |
| FR-3.2 아이템 type·recipe | ✅ 65 combined / 10 component |
| FR-3.4 pandas 선언 | ✅ |
| FR-3.5 캐싱 | ✅ TTL 24h, 3단 |
| FR-6.1 iconUrl 생성 | ✅ |
| NFR-2 단위 테스트 | ✅ 42건 |
| NFR-3 타입 안전성 | ✅ 타입 힌트 적용 |

---

## 후속 유닛에 대한 영향

- **U2**: `traits`·`recipe` 가 실제로 채워졌으므로 `ChampionsPage` 특성 필터와
  `ItemsPage` 분류 탭·조합법 Modal 이 **코드 변경 없이 동작할 조건**이 갖춰졌다. U2 에서 확인한다.
- **U5**: `iconUrl` 이 생성되므로 아이콘 표시 검증이 가능하다.

---

## 남긴 기술 부채

| 항목 | 사유 |
|---|---|
| `riot_live.py` 의 특성 이름 매핑이 `cdragon.py` 와 중복 (TD-7) | `riot_live.py` 수정은 범위 밖 |
| 디스크 캐시 2.1MB | 축소하려면 계층 분리를 깨야 한다 |
