# U3 Implementation Summary — 빈 상태 UX 개선

**완료일**: 2026-08-04

## 파일 변경

| 파일 | 유형 | 내용 |
|---|---|---|
| `frontend/src/components/feedback/DataNotCollected.tsx` | **생성** | "수집 전" 안내 + 수집 명령 표시 |
| `frontend/src/components/feedback/DataNotCollected.test.tsx` | **생성** | 3건 |
| `frontend/src/pages/StatisticsPage.tsx` | 수정 | `-` 카드 → 안내, 필터 비활성, 증강체 빈 목록 문구 |
| `frontend/src/pages/CompsPage.tsx` | 수정 | 데이터 부재 ↔ 필터 결과 없음 구분 |
| `frontend/src/pages/CompDetailPage.tsx` | 수정 | 동일 구분 |
| `frontend/src/components/common/Dropdown.tsx` | 수정 | `disabled`·`title` prop 추가 |
| `frontend/src/types/domain.ts` | 수정 | `MetaStats.hasData`·`supportedFilters` **선택 필드** 추가 |
| `frontend/src/mocks/statistics.ts` | 수정 | 목 모드용 `hasData: true` |
| `backend/app/main.py` | 수정 | `/api/statistics` 에 `hasData`·`supportedFilters` 동봉 |

## 설계 판단

**`EmptyState` 와 분리한 이유**: 두 상태가 사용자에게 요구하는 행동이 다르다.
"조건에 맞는 결과 없음"은 필터를 바꾸면 되지만, "수집 전"은 파이프라인을 돌려야 한다.
같은 컴포넌트로 뭉뚱그리면 사용자가 다음에 무엇을 할지 알 수 없다.

**데이터 부재 판별**
- 통계: 백엔드가 `hasData: false` 로 명시 (문자열 비교 같은 취약한 방식을 피함)
- 조합: 원본 배열이 비었으면 수집 전, 필터 결과만 비었으면 `EmptyState`

**계약 변경**: `MetaStats` 에 **선택 필드 2개만** 추가했다. 기존 소비자와 목 데이터가 그대로 동작한다.

## 검증

| 항목 | 결과 |
|---|---|
| `-` 값 카드 | **0개** (이전: 4개) |
| 안내 + 수집 명령 표시 | ✅ |
| 패치·티어 필터 비활성 + 사유 툴팁 | ✅ 2개 |
| 목 모드 회귀 | ✅ 정상 데이터 복귀, 필터 활성 |
| 테스트 | 3건 통과 |

## 요구사항

FR-2.1 ✅ · FR-2.2 ✅ · FR-2.3 ✅ · FR-2.4 ✅ · FR-3.3 ✅ · FR-5.4 ✅
