# Unit Test Execution

## 실행

### 백엔드 (pytest)

```bash
cd backend && python -m pytest tests/ -q
```

**기대 결과**: `56 passed`

### 프론트엔드 (Vitest)

```bash
cd frontend && npm test
```

**기대 결과**: `Test Files 4 passed | Tests 17 passed`

---

## 테스트 구성

### 백엔드 — 56건

| 파일 | 건수 | 대상 |
|---|---|---|
| `backend/tests/test_cdragon.py` | 20 | 에셋 URL 변환, 세트 결정, 스냅샷 추출, 실패 폴백, 디스크 캐시 |
| `backend/tests/test_static_data.py` | 36 | 챔피언·아이템 선별, 필드 변환, 참조 무결성, 설명 정제, 변종 중복 제거 |

**핵심 검증 항목**

| 규칙 | 검증 내용 |
|---|---|
| BR-1 | `traits` 없는 PVE 유닛 제외, `cost` 범위 밖 제외, `tileIcon` 사용(`squareIcon` 아님) |
| BR-2.2 | 구세트 조합 아이템 제외, 현재 세트 아이템 포함 |
| BR-2.3 | 기본 재료를 `composition` 에서 역산 (하드코딩 아님) |
| BR-2.4 | 재료 누락 조합 아이템 제외, 모든 `recipe` 참조가 해결됨 |
| BR-2.5 | `GrantOrbs` 류 내부 트리거 제외 |
| BR-2.7 | 표시명 중복 시 가장 짧은 id 를 대표로 |
| BR-3.2 | `@변수@` 를 `effects` 값으로 치환, 마크업 태그 제거, 해석 불가 자리표시자 줄 삭제 |
| BR-4 | `.tex`/`.dds` → `.png`, 소문자화, `null` 입력 |
| BR-7 | 네트워크 실패·비200·잘못된 JSON 에서 예외 미전파 |

**외부 의존 처리**: 실제 네트워크를 쓰는 테스트는 없다.
`conftest.py` 의 샘플 스냅샷으로 변환 로직만 검증하고, HTTP 는 `monkeypatch` 로 대체한다.

### 프론트엔드 — 17건

| 파일 | 건수 | 대상 |
|---|---|---|
| `src/components/common/SearchBar.test.tsx` | 7 | Riot ID 파싱 (태그 분리·생략·다중 `#`·빈 이름) |
| `src/components/charts/PlacementChart.test.tsx` | 6 | 평균 등수·Top4율 계산, 범위 밖 매치 제외, 빈 상태 |
| `src/components/feedback/DataNotCollected.test.tsx` | 3 | 안내·명령 표시, 맞춤 메시지, 명령 숨김 |
| `src/components/domain/TierBadge.test.tsx` | 1 | 기존 테스트 |

---

## 커버리지 방침

**NFR-2 에 따라 신규·변경 코드만 테스트한다.** 기존 코드 소급 테스트는 범위 밖이다.

테스트되지 않는 영역 (의도적):

| 영역 | 사유 |
|---|---|
| `riot_live.py`, `dataset.py` | 이번 작업에서 변경하지 않음 (범위 밖) |
| `pipeline/**` | 범위 밖 |
| 페이지 컴포넌트 렌더 | 브라우저 수동 검증으로 대체 (integration-test-instructions.md) |

---

## 실패 시 대응

1. 출력에서 실패한 테스트 이름 확인
2. 해당 규칙을 `aidlc-docs/construction/U1/functional-design/business-rules.md` 에서 대조
3. 코드 수정 후 재실행

**주의**: `static_data` 는 `lru_cache` 를 쓰므로, 테스트에서 데이터를 바꿀 때는
`static_data.reset_cache()` 를 호출해야 한다. `conftest.py` 의 `patched` 픽스처가 자동으로 처리한다.
