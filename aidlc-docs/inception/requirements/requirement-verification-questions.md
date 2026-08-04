# Requirements Clarification Questions

각 질문의 `[Answer]:` 뒤에 알파벳을 적어주세요. 맞는 선택지가 없으면 `X` 를 고르고 뒤에 설명을 적어주시면 됩니다.
다 쓰신 뒤 "다 했어" 라고 알려주세요.

---

## 배경 (읽고 답해주세요)

Reverse Engineering 결과, **프론트엔드는 이미 상당히 완성되어 있습니다.**

- 12개 페이지 · 40개 컴포넌트 · 6개 API 훅이 모두 구현됨 (PRD 마일스톤 F1·F2·F3 완료)
- 2026-07-25 에 op.gg 풍으로 UI 테마까지 전면 개편됨
- 백엔드 6개 엔드포인트도 배선 완료

**그런데 지금 `npm run dev` 로 띄우면 화면 대부분이 비어 보입니다.** 이유는 코드가 아니라 데이터입니다.

| 원인 | 결과 |
|---|---|
| `data/` 디렉토리가 아예 없음 | `/api/statistics` → "수집 데이터 없음", `/api/comps`·`/api/champions`·`/api/items` → 빈 배열 |
| `frontend/.env` 가 `VITE_USE_MOCK=false` | 목 데이터 폴백이 꺼져 있어 빈 응답이 그대로 화면에 노출 |
| `pandas` 가 `backend/requirements.txt` 에 없음 | 통계·조합 API 가 `ImportError` 로 500 |

즉 **"프론트엔드를 만든다"** 는 요청이 여러 갈래로 해석될 수 있어, 아래 질문으로 범위를 확정하려 합니다.

---

## Question 1
이번 작업에서 프론트엔드를 어떻게 하고 싶으신가요? **(가장 중요한 질문)**

A) 기존 프론트엔드를 그대로 두고, **데이터가 실제로 보이도록** 만든다 (PRD F4 완성 — `data/` 확보 + 백엔드 결함 수정 + 계약 불일치 해소)

B) 기존 프론트엔드를 유지하되 **F5 고도화**까지 한다 (Recharts 차트, 챔피언/조합 상세 페이지 실내용, 아이콘 연결)

C) A + B 둘 다 (데이터 살리기 → 고도화까지 이번에 전부)

D) 기존 프론트엔드를 **버리고 새로 만든다**

E) 특정 페이지·기능만 손본다 (뒤에 어떤 것인지 적어주세요)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
데이터는 어떻게 채우기를 원하시나요?

A) **실제 데이터** — 파이프라인을 실제로 돌려 매치를 수집하고 DDragon 미러도 설치해서, 진짜 통계가 보이게 한다

B) **목 데이터** — 백엔드/데이터는 건드리지 않고 `VITE_USE_MOCK=true` 로 되돌려 UI 완성도에만 집중한다

C) **하이브리드** — 실데이터가 가능한 것(전적검색·랭킹)은 실데이터로, 나머지는 목 데이터로 보이게 한다

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
프론트엔드 외에 어디까지 수정해도 되나요?

A) **프론트엔드만** (`frontend/`) — 백엔드는 손대지 않는다

B) 프론트엔드 + **백엔드 API** (`backend/`) — pandas 누락, `patch`/`tier` 파라미터 무시, 계약 불일치 등 수정 허용

C) 프론트엔드 + 백엔드 + **파이프라인** (`pipeline/`) — 데이터 수집·전처리 실행 및 수정까지 허용

D) 위 전부 + **`ml/` 구현** (조합 클러스터링 신규 개발)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
Riot API 키 상태를 알려주세요. 전적검색과 랭킹이 여기에 달려 있습니다. (개발용 키는 24시간마다 만료됩니다)

A) 유효한 키가 있고, 만료되면 재발급할 수 있다

B) 키는 있지만 지금 만료 상태다 — 재발급 후 진행하겠다

C) 키가 없다 — 키 없이도 되는 작업 위주로 진행해달라

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
데이터 수집 파이프라인(`python -m pipeline.run`)을 실제로 실행할 수 있나요?
Riot 레이트리밋 때문에 규모가 곧 소요시간입니다 (기본 설정 15명×20판 ≈ 수 분, 대규모는 수십 분 이상).

A) 실행 가능 — **소규모**로 돌려서 화면 검증용 데이터만 확보한다 (`--players 3 --matches 5`)

B) 실행 가능 — **충분한 규모**로 돌려서 의미 있는 통계를 만든다 (시간 소요 감수)

C) 실행하지 않는다 — 데이터 수집은 이번 범위 밖

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6
DDragon 로컬 미러(`data/TFT_DDragon/`)를 설치해도 될까요?
챔피언·아이템 목록 API 가 이 미러를 읽습니다. `git clone --depth 1 https://github.com/noxelisdev/TFT_DDragon.git data/TFT_DDragon` 로 받으며, 용량이 수백 MB 수준입니다. (`data/` 는 `.gitignore` 되어 있어 커밋되지 않습니다)

A) 예, 설치한다 (챔피언·아이템 페이지를 실데이터로 채우려면 필요)

B) 아니오 — 대신 **DDragon CDN 을 직접 호출**하도록 백엔드를 수정해서 미러 없이 동작하게 한다

C) 아니오 — 챔피언·아이템은 목 데이터로 둔다

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
가장 먼저 결과를 보고 싶은 영역은 어디인가요? (작업 순서를 정하는 데 씁니다)

A) 지금 비어 보이는 화면 채우기 — 데이터 통계 · 전략가(조합) · 챔피언 · 아이템

B) 전적검색 완성도 높이기 — 현재 실제로 동작하는 몇 안 되는 기능

C) 홈 화면 / 전체 UI 다듬기 (`gold` → `brand` 정리 등 UI 개편 문서의 잔여 TODO)

D) 새 기능 추가 (뒤에 어떤 기능인지 적어주세요)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 8
이번 작업의 "완료" 기준은 무엇인가요?

A) 로컬에서 `npm run dev` 로 띄웠을 때 모든 탭이 의미 있는 내용으로 렌더되면 완료

B) A + `npm run typecheck` 와 `npm test` 통과

C) B + 배포까지 (배포 대상은 뒤에 적어주세요 — 현재 `docker-compose.yml` 은 빈 파일이고 배포 설정이 전혀 없습니다)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
테스트는 어느 수준으로 요구하시나요? (현재 테스트는 프론트엔드에 1개뿐이고 백엔드·파이프라인은 0개입니다)

A) 현행 유지 — 테스트는 이번 범위 밖

B) **새로 만들거나 변경한 코드에만** 단위 테스트 추가

C) 기존 코드 포함 **포괄적으로** 테스트 확충

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 10: Security Extensions
Should security extension rules be enforced for this project?
(이 프로젝트에 보안 확장 규칙을 적용할까요?)

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 11: Resiliency Extensions
Should the resiliency baseline be applied to this project?
(복원력 베이스라인을 적용할까요?)

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 12: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?
(속성 기반 테스트 규칙을 적용할까요?)

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: 
