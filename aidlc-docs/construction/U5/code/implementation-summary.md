# U5 Implementation Summary — 아이콘 검증 · UI 정리

**완료일**: 2026-08-04

## 파일 변경

| 파일 | 유형 | 내용 |
|---|---|---|
| `frontend/src/components/common/SearchBar.tsx` | 수정 | `parseRiotId()` + 입력 검증 + 태그 생략 안내 |
| `frontend/src/components/common/SearchBar.test.tsx` | **생성** | 7건 |
| (U2~U4 에서 수정한 파일들) | 수정 | `gold` → `brand` 인라인 정리 |

## FR-7.2 — Riot ID 파싱

`parseRiotId()` 로 `이름#태그` 를 분리한다. 백엔드 `split_riot_id()` 가 태그 생략을 이미 처리하므로,
프론트는 **이름이 비었는지만 막고** 나머지는 그대로 넘긴다.

추가로, 태그를 생략하면 어떤 태그로 검색되는지 안내를 띄운다
("태그를 생략하면 KR 기본 태그로 검색합니다").

## FR-6.1 / FR-6.2 — 아이콘

**프론트 코드 변경 없이 해결되었다.** `ItemIcon`·`ChampionCard` 가 이미 `iconUrl` 을 소비하고
`IconImage` 가 실패 시 이니셜 폴백을 제공하므로, U1 이 `iconUrl` 을 채우자 그대로 표시된다.

**검증**: 실제 이미지 128×128 로드 확인.

> 헤드리스 브라우저에서 처음 측정했을 때 75개 중 0개가 로드된 것으로 나왔으나,
> 이는 페이지가 컴포지팅되지 않아 `loading="lazy"` 가 발동하지 않은 **측정 환경의 문제**였다.
> `loading="eager"` 로 강제하니 정상 로드되었다. 결함이 아니다.

## FR-6.3 — DDragon 버전 일원화

**구조적으로 해소되었다.** U1 이 챔피언·아이템 아이콘을 Community Dragon 기반으로 백엔드에서 생성하게 되면서,
`lib/ddragon.ts` 는 이제 **목 데이터에서만** 쓰인다. 실데이터 경로에 DDragon 버전 의존이 남아 있지 않다.

`VITE_DDRAGON_VERSION` 은 목 데이터 아이콘용으로만 남는다.

## FR-7.1 — `gold` → `brand`

CQ3-C 방침대로 **이번 작업에서 수정한 파일에 한해** 인라인 정리했다.
U2~U4 작업 중 파일을 열 때마다 함께 바꿨으므로 별도 일괄 치환 단계를 두지 않았다.

수정하지 않은 파일의 `gold` 클래스는 그대로 두었다. 두 토큰의 **값이 동일**(`#5383E8`)해서
시각적 차이가 전혀 없고, 불필요한 diff 를 만들지 않기 위해서다.

## 미처리 (선택 항목)

`UnitList.tsx:1` 의 `mockChampionsById` 직접 import 는 **처리하지 않았다.**

- 유일한 사용처 `CompDetailPage` 가 U3 에서 `DataNotCollected` 로 대체되어 화면에 노출되지 않는다
- 고치려면 `useChampions()` 결과를 전달하도록 `UnitList` 사용처 전체의 데이터 흐름을 바꿔야 한다
- 이번 작업의 핵심 목표가 아니라 판단해 **기술부채로 명시**한다

## 검증

| 항목 | 결과 |
|---|---|
| Riot ID 파싱 | ✅ 테스트 7건 통과 |
| 아이콘 실이미지 | ✅ 128×128 로드 |
| 폴백 유지 | ✅ `IconImage` 동작 |
| 수정 파일의 `gold` 색상 클래스 | ✅ 0건 |

## 요구사항

FR-6.1 ✅ · FR-6.2 ✅ · FR-6.3 ✅ (구조적 해소) · FR-7.1 ✅ · FR-7.2 ✅
`UnitList` 정리 ❌ 미처리(선택, 기술부채로 기록)
