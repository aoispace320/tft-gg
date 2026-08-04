# Requirements Clarification Questions

기존 답변(`1-B 2-A 3-A 4-A 5-C 6-A 7-C 8-A`)을 검토한 결과 **논리적 충돌 3건**과 **미답변 4건**이 있습니다.
아래 질문에 답해주시면 요구사항 문서를 확정하겠습니다.

---

## 먼저: 현재 답변으로 확정된 것

| 항목 | 결정 |
|---|---|
| Riot API 키 | 유효, 재발급 가능 (Q4-A) → **전적검색 · 랭킹은 실데이터로 동작** |
| DDragon 로컬 미러 | 설치한다 (Q6-A) → **챔피언 · 아이템은 실데이터로 동작** |
| 수정 범위 | `frontend/` 만 (Q3-A) |
| 완료 기준 | `npm run dev` 로 모든 탭이 의미 있게 렌더 (Q8-A) |

즉 6개 API 중 **4개는 실데이터로 살아납니다.** 문제는 나머지 2개입니다.

---

## 충돌 1: "실제 데이터"(Q2-A) vs "수집 안 함"(Q5-C)

`/api/statistics`(데이터 통계)와 `/api/comps`(전략가/조합)의 **유일한 데이터 생성 경로가 파이프라인**입니다.
`data/processed/tft_participants.csv` 가 있어야 하는데, 이 파일은 `python -m pipeline.run` 을 돌려야만 생깁니다.

Q5 에서 수집을 하지 않기로 하셨으므로, **이 두 화면은 영구히 빈 값**입니다.
현재 `.env` 가 `VITE_USE_MOCK=false` 라서 "수집 데이터 없음 / `-` / 빈 목록"이 그대로 화면에 노출됩니다.
이 상태로는 Q8-A(모든 탭이 의미 있게 렌더)를 만족할 수 없습니다.

### Clarification Question 1
데이터 통계 · 전략가(조합) 두 화면을 어떻게 처리할까요?

A) **이 두 화면만 목 데이터로 폴백** — 나머지 4개는 실데이터, 통계·조합은 `src/mocks/` 사용 (프론트엔드만 수정하면 되므로 Q3-A 와 충돌 없음)

B) **파이프라인을 소규모로 한 번만 실행** — Q5 결정을 뒤집고 `--players 3 --matches 5` (수 분)로 최소 데이터 확보. 실데이터 6/6 달성

C) **빈 상태 그대로 두되 안내 문구를 개선** — "데이터 수집 전입니다" 같은 EmptyState 로 의도된 화면임을 표현

D) 두 화면은 이번 작업 범위에서 제외

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## 충돌 2: "F5 고도화"(Q1-B) vs "프론트엔드만 수정"(Q3-A)

Q1-B 로 고르신 F5 항목 중 **백엔드를 안 고치면 완성이 불가능한 것들**이 있습니다.

| F5 항목 | 막히는 이유 | 위치 |
|---|---|---|
| 챔피언 상세의 특성 표시 · 챔피언 목록 특성 필터 | `/api/champions` 의 `traits` 가 **항상 빈 배열** (DDragon 챔피언 데이터에 특성 연결이 없음) | `backend/services/static_data.py:42` |
| 아이템 조합법 · '조합/기본 재료' 분류 탭 | `/api/items` 가 `recipe` 를 안 주고 `type` 이 전부 `combined` | `backend/services/static_data.py:60` |
| 통계 패치 · 티어 필터 | 백엔드가 `patch` · `tier` 쿼리 파라미터를 **받고 무시** | `backend/app/main.py:53` |

### Clarification Question 2
이 항목들을 어떻게 할까요?

A) **백엔드 수정을 최소한으로 허용** — 위 3가지를 고치기 위해 `backend/services/static_data.py` 와 `main.py` 만 손댄다 (Q3 를 A → B 로 완화)

B) **프론트엔드에서 우회** — 특성 매핑 테이블·아이템 조합법을 `frontend/src/` 안에 자체 데이터로 두고 해결 (백엔드 무수정 유지, 대신 프론트에 게임 데이터가 하드코딩됨)

C) **해당 항목들은 F5 범위에서 제외** — 차트와 상세 페이지 레이아웃 등 백엔드 무관한 것만 진행

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 충돌 3: 작업 우선순위 (Q1-B) vs (Q7-C)

Q1 에서는 **F5 고도화**(차트 · 상세 페이지 · 아이콘)를, Q7 에서는 **UI 다듬기**(`gold` → `brand` 정리 등)를 우선으로 고르셨습니다.
서로 배타적이지는 않지만 순서를 정해야 합니다. 참고로 `gold` 클래스는 **28개 파일**에서 쓰이고 있습니다.

### Clarification Question 3
어느 것을 먼저 할까요?

A) **UI 정리 먼저** — `gold` → `brand` 치환(28개 파일)과 UI 개편 문서의 잔여 TODO 를 끝낸 뒤 F5 착수

B) **F5 먼저** — 차트·상세 페이지 등 기능을 먼저 만들고, `gold` → `brand` 는 나중에 (또는 생략)

C) **병행** — 건드리는 파일에서만 `gold` → `brand` 를 함께 정리하는 방식으로 점진 처리

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## 확인: Recharts 신규 설치

Q1-B 의 차트 연동에는 Recharts 가 필요한데 **현재 `package.json` 에 없습니다.**
PRD §9-5 에도 "F5 단계 도입 예정, 확정 대기" 로만 적혀 있어 아직 확정되지 않은 결정입니다.

### Clarification Question 4
차트 라이브러리를 어떻게 할까요?

A) **Recharts 설치** — PRD 가 예정했던 대로 진행

B) **다른 라이브러리 사용** (뒤에 어떤 것인지 적어주세요)

C) **라이브러리 없이** SVG/CSS 로 간단한 막대·선 그래프 직접 구현 (의존성 추가 없음)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 미답변 질문 (원본 Q9~Q12)

### Clarification Question 5 (원본 Q9)
테스트는 어느 수준으로 요구하시나요? (현재 프론트엔드 테스트 1개, 백엔드·파이프라인 0개)

A) 현행 유지 — 테스트는 이번 범위 밖

B) **새로 만들거나 변경한 코드에만** 단위 테스트 추가

C) 기존 코드 포함 **포괄적으로** 테스트 확충

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Clarification Question 6 (원본 Q10 — Security Extension)
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Clarification Question 7 (원본 Q11 — Resiliency Extension)
Should the resiliency baseline be applied to this project?

AWS Well-Architected Framework(Reliability Pillar) 기반의 **설계 시점 방향성 모범사례**입니다.
적용해도 프로덕션 준비 완료를 보장하거나 가용성·RTO·RPO 목표를 인증하지 않으며, 좋은 출발점 역할만 합니다.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Clarification Question 8 (원본 Q12 — Property-Based Testing)
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers)

X) Other (please describe after [Answer]: tag below)

[Answer]: C
