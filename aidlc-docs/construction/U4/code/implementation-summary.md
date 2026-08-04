# U4 Implementation Summary — 차트 도입

**완료일**: 2026-08-04

## 파일 변경

| 파일 | 유형 | 내용 |
|---|---|---|
| `frontend/src/components/charts/ChartContainer.tsx` | **생성** | `ResponsiveContainer` 래퍼 + 공통 테마 상수 |
| `frontend/src/components/charts/PlacementChart.tsx` | **생성** | 등수 분포 막대 그래프 + `summarize()` |
| `frontend/src/components/charts/PlacementChart.test.tsx` | **생성** | 6건 |
| `frontend/src/pages/SummonerPage.tsx` | 수정 | 요약 카드 + 차트 배치 |
| `frontend/package.json` | 수정 | `recharts ^3.10.1` |

## 설계 판단

**차트를 전적검색에 배치한 이유**: 이번 작업에서 **실데이터로 동작하는 유일한 차트**다.
통계·조합은 전처리 데이터가 없어(Q5-C) 그릴 값이 없다. `StatisticsPage` 차트는 설계대로 유예했다(FR-4.5).

**색상 상수를 TS 에 둔 이유**: Recharts 는 Tailwind 클래스를 받지 못한다.
`tailwind.config.js` 의 토큰 값을 `CHART_COLORS` 에 복제하되, 출처를 주석에 남겼다.

**Top4 색상 구분**: 1~4등은 브랜드 블루, 5~8등은 패배 색(`#E84057`). op.gg 의 승/패 색 관례를 따랐다.

**추가 API 요청 없음**: 이미 받아온 `matches` 배열을 클라이언트에서 집계한다 (NFR-7).

## 검증

| 항목 | 결과 |
|---|---|
| 차트 렌더 | ✅ 막대 8개 |
| 평균 등수 · Top4율 · 표본 | ✅ 4.50등 / 50.0% / 12판 |
| 매치 0건일 때 | ✅ 자체 안내 문구 |
| 반응형 (NFR-5) | ✅ `ResponsiveContainer` |
| 테스트 | 6건 통과 |

**주의**: 실데이터 검증은 Riot 키 만료로 하지 못했다. 목 모드로 대체 검증했다.

## 요구사항

FR-4.1 ✅ · FR-4.2 ✅ · FR-4.3 ✅ · FR-4.4 ❌ 미착수(선택) · FR-4.5 ✅ 유예
