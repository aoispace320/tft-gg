# Unit of Work Plan

**작성일**: 2026-08-03
**Depth**: Minimal (execution-plan.md 결정)
**선행**: Application Design 완료

---

## 분해 전제

유닛 골격은 `execution-plan.md` §4 와 `application-design.md` §5 에서 이미 도출되었다.
본 계획서는 그 골격의 **경계를 확정**하고 남은 결정을 해소한다.

| Unit | 잠정 범위 | 컴포넌트 |
|---|---|---|
| U1 | 백엔드 정적 데이터 소스 교체 | C-1 `cdragon.py`(신규), C-4 `static_data.py`, C-5 `main.py` |
| U2 | 챔피언 · 아이템 화면 | C-6 `ChampionDetailPage` (+ 2개 페이지 동작 확인) |
| U3 | 빈 상태 UX | C-3 `DataNotCollected`(신규), C-7 3개 페이지 |
| U4 | 차트 | C-2 `charts/`(신규), C-8 `SummonerPage` |
| U5 | 아이콘 · UI 정리 | C-9 `SearchBar`, 아이콘 검증, `gold`→`brand` |

### ⚠️ User Stories 부재에 따른 조정

User Stories 단계가 SKIP 되었으므로 `unit-of-work-story-map.md` 에 매핑할 스토리가 없다.
**대신 `requirements.md` 의 FR/NFR 을 유닛에 매핑**하여 동일한 추적성 목적을 달성한다.
이 조정을 산출물에 명시한다.

---

## 계획 (Checklist)

### Part 1 — Planning
- [x] 유닛 골격 확인 (execution-plan · application-design 로부터)
- [x] 분해 질문 생성 (UQ1~UQ5)
- [x] 사용자 답변 확보 — "추천대로" (2026-08-03)
- [x] 답변의 모호성 · 모순 분석 — 아래 §분석 결과 참조
- [x] 계획 승인

### Part 2 — Generation (승인 후)
- [x] `application-design/unit-of-work.md` 생성 — 유닛 정의와 책임
- [x] `application-design/unit-of-work-dependency.md` 생성 — 의존 매트릭스
- [x] `application-design/unit-of-work-story-map.md` 생성 — **FR/NFR → 유닛 매핑** (스토리 부재 조정)
- [x] 유닛 경계와 의존 검증
- [x] 모든 FR/NFR 이 유닛에 배정되었는지 확인
- [x] `aidlc-state.md` 갱신

---

## 답변 요약 및 분석 결과 (2026-08-03)

사용자 지시: "추천대로" → 제시된 추천안 전체 채택.

| 질문 | 답 | 결정 |
|---|---|---|
| UQ1 | **C** | 특성은 **문자열 이름만** 사용. 계약·프론트 무변경. 특성 아이콘은 범위 밖 |
| UQ2 | **B** | `supportedFilters` 를 **U3** 으로 이동. U1 은 `cdragon.py` + `static_data.py` 로 한정 |
| UQ3 | **B** | 실행 순서 **U1 → U3 → U4 → U2 → U5** |
| UQ4 | **B** | **커밋하지 않음.** 파일만 수정, 커밋은 사용자 판단 |
| UQ5 | **A** | **유닛 5개 유지** |

### 모호성 · 모순 분석 (MANDATORY)

전 항목 단일 선택지, 서술형 응답 없음.

- **모순 없음** — UQ3-B 의 순서(U1→U3→U4→U2→U5)가 모든 의존을 만족한다. U2·U5 가 U1 뒤에 오고, U3·U4 는 선행 의존이 없다
- **모호성 없음** — "혼합", "경우에 따라" 류 없음
- **후속 질문 불필요**

**파생 결과 1건**: UQ1-C 로 **FR-6.1 의 "특성 아이콘" 부분이 범위에서 빠진다.**
실제 확인 결과 `TraitIcon.tsx` 는 이미지가 아니라 `◆` 글리프 + 이름 텍스트 칩이라 **변경 없이 그대로 두면 된다.**
FR-6.1 의 유닛·아이템 아이콘은 U1 의 `iconUrl` 로 충족되므로 실질 손실은 없다.

---

## 계획 수립 중 발견된 기존 결함

### ⚠️ `UnitList.tsx` 가 목 데이터를 직접 import 한다

```
frontend/src/components/domain/UnitList.tsx:1
  import { mockChampionsById } from '@/mocks/champions';
```

프로덕션 컴포넌트가 `USE_MOCK` 스위치와 무관하게 **항상 목 데이터에서 챔피언을 조회**한다.
실 API 모드에서도 조합 핵심 유닛의 이름·아이콘·코스트가 목 데이터 기준으로 렌더된다.

**영향**: `CompDetailPage` 의 "핵심 유닛" 표시. 다만 조합 데이터 자체가 없어(Q5-C) 해당 화면은
U3 에서 `DataNotCollected` 로 대체되므로 **당장의 사용자 영향은 없다.**

**처리**: U5 에 **선택 항목**으로 배정한다. `useChampions()` 결과를 쓰도록 고치는 것이 정답이나,
이번 범위의 핵심 목표는 아니므로 시간이 남을 때 처리하고, 못 하면 기술부채로 명시해 남긴다.

> **Greenfield 전용 항목 생략**: 코드 조직 전략(디렉토리 구조 결정)은 **브라운필드이므로 해당 없음.**
> 기존 구조(`backend/app/services/`, `frontend/src/components/`)를 그대로 따른다.

---

## 분해 질문

채팅으로 `UQ1-A UQ2-B ...` 형식으로 주셔도 됩니다. 추천안은 각 질문 끝에 표시했습니다.

---

### UQ1. 특성(Trait) 목록을 어떻게 노출할까요? (Dependencies)

Application Design 미결 #1. 챔피언 상세와 `TraitIcon` 이 특성의 **한글명과 아이콘**을 필요로 합니다.
CDragon 챔피언 데이터의 `traits[]` 는 **한글 이름만** 담고 있어 아이콘 URL 이 없습니다.

A) **`/api/traits` 전용 엔드포인트 신설** — 프론트가 별도 훅(`useTraits`)으로 조회. 아이콘·설명까지 온전히 제공되지만 **프론트에 새 api/hook 파일이 필요**해져 "프론트 무변경" 원칙이 일부 깨진다

B) **챔피언 응답에 특성 객체를 임베드** — `Champion.traits` 를 문자열 배열 대신 객체 배열로 변경. **`types/domain.ts` 계약을 바꿔야 하므로 기존 `ChampionsPage` 필터 코드가 깨진다** (현재 `c.traits.includes(trait)` 로 문자열 비교)

C) **이번엔 이름만 사용, 아이콘은 생략** — `Champion.traits` 를 문자열 배열 그대로 유지. 특성 필터·상세 표시가 즉시 동작하고 **계약·프론트 코드 모두 무변경**. 특성 아이콘은 U5 또는 향후 과제로 미룸 ← **추천**

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **추천 근거**: B 는 이미 동작하는 `ChampionsPage` 필터를 깨뜨려 DQ8-A(U2 축소)의 전제를 무너뜨린다.
> A 는 가능하지만 특성 아이콘 하나 때문에 프론트 데이터 계층을 건드리게 된다.
> C 로 가면 FR-5.1·FR-5.2 가 **코드 변경 없이 즉시 충족**되고, 특성 아이콘은 별도 결정으로 분리된다.

---

### UQ2. `supportedFilters`(C-5, `main.py`)를 어느 유닛에 넣을까요? (Story Grouping)

Application Design 은 C-5 를 U1 에 배치했으나, 이를 **소비하는 쪽은 U3**(`StatisticsPage` 필터 비활성화)입니다.

A) **U1 에 유지** — 백엔드 변경을 한 유닛에 모은다. 다만 U3 착수 전까지 이 필드를 쓰는 곳이 없어 검증이 미뤄진다

B) **U3 으로 이동** — 백엔드 한 줄과 그것을 쓰는 프론트를 같은 유닛에서 함께 만들고 검증한다. U1 은 순수하게 "정적 데이터 소스 교체"만 담당해 경계가 선명해진다 ← **추천**

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **추천 근거**: 생산자와 소비자를 같은 유닛에 두면 그 유닛만으로 동작 검증이 끝난다.
> U1 의 롤백 경계도 `cdragon.py` + `static_data.py` 두 파일로 깔끔해진다.

---

### UQ3. 유닛 실행 순서는? (Technical Considerations)

U3·U4 는 U1 과 의존이 없어 병행 가능합니다.

A) **엄격한 순차** — U1 → U2 → U3 → U4 → U5. AI-DLC 기본 방식. 각 유닛이 완결된 뒤 다음으로 이동하므로 승인 게이트가 명확

B) **의존 순서만 지키고 재배치** — U1 → U3 → U4 → U2 → U5. 백엔드(U1) 직후 **백엔드와 무관한 프론트 작업(U3·U4)**을 처리하고, U2 는 U1 결과를 실제로 확인한 뒤 진행 ← **추천**

C) **U1 만 먼저, 나머지는 그때 결정** — U1 완료 후 실제 화면을 보고 우선순위 재조정

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **추천 근거**: U2 는 "U1 이 실제로 무엇을 반환하는지 본 뒤"가 가장 안전하다 (DQ8 에서 이미 축소된 유닛이기도 하다).
> 그 사이에 U3·U4 를 처리하면 대기 없이 진행된다.

---

### UQ4. Git 커밋 전략은? (Team Alignment)

`execution-plan.md` 의 롤백 전략이 "유닛별 커밋 분리"를 전제하고 있습니다.
현재 브랜치는 `main` 이고 원격은 `origin/aoispace320/tft-gg` 입니다.

A) **유닛마다 커밋** — 유닛 완료 시 제가 커밋 생성. 롤백 지점이 명확해진다. 푸시는 하지 않음

B) **커밋하지 않음** — 파일만 수정하고 커밋은 사용자님이 직접 판단해서 수행 ← **추천**

C) **전체 완료 후 한 번** — 모든 유닛이 끝나면 단일 커밋

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **추천 근거**: 현재 `main` 브랜치에서 직접 작업 중이고 협업자(우진·진영)가 있는 저장소다.
> 커밋 시점과 메시지는 사용자님이 통제하시는 편이 안전하다. 원하시면 A 로 바꿔도 무방하다.

---

### UQ5. 유닛 5개 분해를 유지할까요? (Business Domain)

DQ8-A 로 U2 가 크게 축소되었습니다(`ChampionDetailPage` 하나 + 동작 확인).

A) **5개 유지** — 각 유닛이 작아도 관심사가 분리되어 검증 단위가 명확 ← **추천**

B) **U2 를 U5 에 병합** — 축소된 U2 를 마무리 유닛에 흡수해 4개로 줄인다. 승인 게이트가 하나 줄어든다

C) **U3·U4 를 병합** — 둘 다 순수 프론트 표현 계층이므로 하나로 합친다 (4개)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **추천 근거**: U2 는 작아졌어도 **U1 의 결과를 실제로 검증하는 관문** 역할을 한다.
> 이 검증을 마무리 유닛에 섞으면 문제 발견이 늦어진다. 다만 속도를 원하시면 B 도 합리적이다.
