# Application Design Plan

**작성일**: 2026-08-03
**Depth**: Standard

---

## ⚠️ 착수 전 발견: 프론트엔드가 이미 대부분 구현되어 있습니다

설계 착수를 위해 실제 소스를 확인한 결과, **요구사항 중 일부는 코드 변경이 전혀 필요 없습니다.**
데이터만 오면 그대로 동작합니다.

| 요구사항 | 원래 계획 | **실제 확인 결과** |
|---|---|---|
| FR-5.2 챔피언 특성 필터 | 구현 필요 | ✅ **이미 구현됨** — `ChampionsPage.tsx:30-41` 이 `champions.flatMap(c => c.traits)` 로 필터 옵션을 만들고 필터링까지 수행. 데이터가 빈 배열이라 옵션이 안 보일 뿐 |
| FR-5.3 아이템 분류 탭 · 조합법 | 구현 필요 | ✅ **이미 구현됨** — `ItemsPage.tsx:35-39` 가 `type` 으로 탭 카운트를 세고, `:80-97` 이 `recipe` 를 받아 조합법 Modal(재료 아이콘 + `+` `=` 기호)까지 렌더 |
| FR-6.1 아이콘 연결 | 프론트 작업 | ✅ **프론트 무변경으로 가능** — `ItemIcon`·`ChampionCard` 가 이미 `item.iconUrl`·`champion.iconUrl` 을 소비하고, `IconImage` 가 실패 시 이니셜 폴백. **백엔드가 `iconUrl` 을 채워주면 끝** |

**결론: 이번 작업의 무게중심은 백엔드 `static_data.py` 한 파일입니다.**
프론트엔드에서 실제로 코드를 써야 하는 곳은 ChampionDetailPage, 빈 상태 3개 페이지, 차트, 검색 입력뿐입니다.

이 발견은 U2 를 크게 축소시키므로, 아래 DQ8 에서 확인을 구합니다.

---

## 설계 계획 (Checklist)

### 1. 컨텍스트 분석
- [x] `requirements.md` (2026-08-03 개정판) 로드
- [x] `execution-plan.md` 유닛 분해 로드
- [x] Reverse Engineering 산출물 로드 (architecture · component-inventory · technology-stack)
- [x] 실제 프론트엔드 소스 확인 (ChampionsPage · ItemsPage · ItemIcon · ChampionCard · IconImage · lib/ddragon)
- [x] Community Dragon 스키마 실측 검증

### 2. 설계 질문 수집
- [ ] 아래 DQ1~DQ8 에 대한 사용자 답변 확보
- [ ] 답변의 모호성 · 모순 분석
- [ ] 필요 시 후속 질문

### 3. 설계 산출물 생성 (승인 후)
- [ ] `application-design/components.md` — 컴포넌트 정의와 책임
- [ ] `application-design/component-methods.md` — 메서드 시그니처 (상세 비즈니스 규칙은 Functional Design 에서)
- [ ] `application-design/services.md` — 서비스 정의와 오케스트레이션
- [ ] `application-design/component-dependency.md` — 의존 매트릭스 · 통신 패턴 · 데이터 흐름
- [ ] `application-design/application-design.md` — 위 문서 통합본
- [ ] 설계 완전성 · 일관성 검증

---

## 설계 질문

각 `[Answer]:` 뒤에 알파벳을 적어주세요. 채팅으로 `DQ1-A DQ2-B ...` 형식으로 주셔도 됩니다.

---

### DQ1. Community Dragon 연동 코드를 어디에 둘까요? (Component Identification)

현재 `static_data.py` 는 62줄로 DDragon 로컬 미러만 읽습니다. 여기에 외부 HTTP 호출 · 캐싱 · 스키마 변환이 추가됩니다.

A) **`static_data.py` 안에 직접 구현** — 파일 하나로 유지. 가장 적은 변경, 대신 파일이 커진다

B) **`services/cdragon.py` 신규 모듈로 분리** — CDragon 페치·캐시·원본 스키마 접근을 전담하고, `static_data.py` 는 도메인 모델 조립만 담당 (기존 `riot_live.py` 가 비대해진 전철을 피함)

C) **`pipeline/collector/ddragon.py` 를 확장해 백엔드와 공유** — 중복 제거(TD-7 해소)되지만 pipeline 이 backend 의 의존이 되어 패키지 결합이 생긴다

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### DQ2. 25MB 페이로드 캐싱 전략은? (Service Layer Design)

Community Dragon 전체 응답이 25.1MB 입니다. 매 요청마다 받을 수는 없습니다.

A) **메모리 캐시만** (`lru_cache`) — 가장 단순. 서버 재시작마다 재다운로드(수 초~수십 초). 개발 중 `--reload` 로 자주 재시작하면 매번 대기

B) **메모리 + 디스크 캐시** — 최초 1회 받아 **필요한 필드만 추출**해 `data/cache/cdragon_set17.json`(수백 KB)로 저장. 이후 재시작에도 즉시 로드. `data/` 는 이미 `.gitignore` 대상

C) **서버 기동 시 프리페치** — 첫 요청이 느려지지 않지만 uvicorn 기동이 그만큼 지연된다

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### DQ3. 기존 DDragon 미러 경로를 어떻게 할까요? (Component Dependencies)

`static_data.py` 는 현재 `data/TFT_DDragon/` 를 읽습니다. Community Dragon 도입 후 이 경로의 운명입니다.

A) **완전 제거** — Community Dragon 단일 소스. 코드가 가장 깨끗하고, 미러 설치가 불필요해진다 (Q6-A 결정이 무효화되지만 사용자 부담은 오히려 감소)

B) **폴백 체인 유지** — CDragon 실패 시 로컬 미러 → 공식 CDN 순으로 시도. 네트워크 장애에 강하지만 코드가 복잡해지고, 미러에는 특성·조합법이 없어 폴백 시 기능이 반쪽이 된다

C) **미러 우선, CDragon 은 보강용** — 기본 목록은 미러에서, 특성·조합법만 CDragon 에서 병합. 미러 설치가 여전히 필수

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### DQ4. 아이콘 URL 은 누가 만들까요? (Component Methods)

CDragon 은 아이콘 경로를 `ASSETS/UX/TFT/ChampionSplashes/TFT17_Briar_Mobile.tex` 형태로 줍니다.
실제 이미지 URL 로 쓰려면 소문자화 + `.tex` → `.png` + CDragon 에셋 베이스 URL 결합이 필요합니다.

A) **백엔드가 완성된 `iconUrl` 을 반환** — 프론트엔드 **무변경**. `ItemIcon`·`ChampionCard` 가 이미 `iconUrl` 을 소비하므로 그대로 동작. 변환 규칙이 데이터 소스와 같은 곳에 있어 응집도가 높다

B) **프론트가 id 로 조립** — `lib/ddragon.ts` 를 확장. 백엔드 응답이 가벼워지지만, CDragon 에셋 경로 규칙을 프론트가 알아야 하고 `lib/ddragon.ts` 의 기존 LoL CDN 로직과 섞인다

C) **혼합** — 백엔드는 원본 경로를, 프론트가 URL 조립

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### DQ5. 현재 세트(Set 17) 지정 방식은? (Design Patterns)

지금은 `static_data.py` 에 `_CURRENT_SET_PREFIX = "TFT17_"` 로 하드코딩되어 있습니다.
CDragon 은 `sets` 객체에 `"17"` 키로 제공하며, 현재 `1,3,4,5,7,13,14,15,16,17` 이 존재합니다.

A) **하드코딩 유지** (`"17"`) — 가장 단순. 세트 변경 시 코드 수정 필요

B) **환경변수로 분리** (`TFT_SET=17`) — 코드 수정 없이 전환 가능. `.env.example` 에 문서화

C) **자동 최신 세트 감지** — `sets` 키 중 최대 숫자를 사용. 새 세트 출시 시 자동 대응하지만, 출시 직후 데이터가 불완전한 기간에 오동작할 수 있다

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### DQ6. `/api/statistics` 의 `patch`·`tier` 파라미터를 어떻게 할까요? (FR-3.3)

현재 백엔드가 파라미터를 받고 무시합니다. 프론트는 `14.11~14.13` 이라는 **실제 데이터와 무관한 하드코딩 패치 목록**을 드롭다운에 표시합니다.

A) **응답에 `supportedFilters` 필드 추가** — 백엔드가 지원 여부를 알리고, 프론트가 그에 따라 필터 UI 를 비활성화/숨김. 향후 실제 필터링이 생기면 자연스럽게 확장

B) **파라미터 자체를 제거** — 백엔드에서 인자를 없애고 프론트 드롭다운도 삭제. 가장 정직하지만 나중에 되살릴 때 다시 작업

C) **하드코딩 패치 목록만 제거** — 드롭다운은 두되 선택지를 실제 데이터(`patch` 응답값)에서 가져오고, 데이터 없으면 비활성

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### DQ7. 차트 컴포넌트를 어디에 둘까요? (Component Identification)

현재 `components/` 는 `layout` · `common` · `feedback` · `domain` 4분류입니다.

A) **`components/domain/` 에 추가** — 기존 분류 유지. `PlacementChart` 등이 도메인 컴포넌트와 함께 위치

B) **`components/charts/` 신규 디렉토리** — 차트가 여러 개로 늘어날 것을 전제로 분리. 5번째 분류가 생긴다

C) **페이지 내부 로컬 컴포넌트** — `SummonerPage.tsx` 안에 정의. 재사용 계획이 없다면 가장 가볍다

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### DQ8. U2 축소를 확인해 주세요 (Scope Confirmation)

위 "착수 전 발견"대로라면 U2(챔피언·아이템 화면 활성화)에서 실제로 코드를 쓸 곳은
**`ChampionDetailPage` 의 "상세 통계 준비 중" EmptyState 교체 하나**뿐이고,
특성 필터·아이템 분류·조합법 Modal 은 U1 완료 후 **동작 확인만** 하면 됩니다.

A) **확인함** — U2 를 축소하고, 남는 여력을 U4(차트)·U5(마무리)에 쓴다

B) **기존 구현을 손보고 싶다** — 이미 동작하더라도 특성 필터를 다중 선택으로 바꾸는 등 개선을 원한다 (원하는 개선을 뒤에 적어주세요)

C) **일단 U1 을 끝내고 실제 화면을 본 뒤 결정한다** — U2 범위 확정을 U1 완료 시점으로 미룬다

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 답변 요약 (2026-08-03 확정)

사용자 지시: "그냥 너 추천대로 해" → 제시된 추천안 전체 채택.

| 질문 | 답 | 결정 내용 |
|---|---|---|
| DQ1 | **B** | `services/cdragon.py` 신규 모듈로 분리 |
| DQ2 | **B** | 메모리 + 디스크 캐시 (필요 필드만 추출) |
| DQ3 | **A** | DDragon 미러 경로 완전 제거, CDragon 단일 소스 |
| DQ4 | **A** | 백엔드가 완성된 `iconUrl` 반환 (프론트 무변경) |
| DQ5 | **B** | 세트 번호를 환경변수 `TFT_SET` 로 분리 |
| DQ6 | **A** | 응답에 `supportedFilters` 추가 |
| DQ7 | **B** | `components/charts/` 신규 디렉토리 |
| DQ8 | **A** | U2 축소 확인 |

### 모호성 · 모순 분석 (MANDATORY)

전 항목이 명확한 단일 선택지이며 서술형 응답이 없다. 검토 결과:

- **모순 없음** — DQ3-A(미러 제거)와 DQ4-A(백엔드가 iconUrl 생성)는 모두 CDragon 단일 소스 전제에서 일관됨
- **모호성 없음** — "혼합", "경우에 따라" 류의 답변 없음
- **후속 질문 불필요**

**단, DQ3-A 는 Requirements 의 Q6-A(DDragon 미러 설치)를 무효화한다.** 이는 사용자 부담을 줄이는
방향(수백 MB 클론 불필요)이므로 범위 축소가 아닌 개선으로 판단하여 진행한다. `requirements.md` FR-1.1' 에 이미 반영됨.

### 설계 착수 전 검증 완료 (A-1 재발 방지)

CDragon 에셋 URL 변환 규칙을 실제 HTTP 요청으로 검증했다. 4개 패턴 전부 **200 응답**:

| 대상 | 원본 필드 | 결과 |
|---|---|---|
| 챔피언 스플래시 | `squareIcon` | 200 (단, **이름과 달리 스플래시 아트**) |
| 챔피언 정사각 아이콘 | `tileIcon` | 200 — **그리드 카드용으로 이것을 사용** |
| 특성 아이콘 | `traits[].icon` | 200 |
| 아이템 아이콘 | `items[].icon` | 200 |

**변환 규칙 (확정)**: `https://raw.communitydragon.org/latest/game/` + `경로.lower()` + `.tex`/`.dds` → `.png`
