# Unit of Work — Requirement Map

> **⚠️ 스토리 부재에 따른 조정**
> User Stories 단계가 SKIP 되었으므로(페르소나 단일 · PRD §6 이 이미 화면별 요구사항 정의)
> 매핑할 사용자 스토리가 없다. 대신 **`requirements.md` 의 FR/NFR 을 유닛에 매핑**하여
> 동일한 추적성 목적을 달성한다. 표준 `unit-of-work-story-map.md` 의 역할을 대체한다.

---

## 1. 기능 요구사항 → 유닛 매핑

| FR | 요구사항 | Unit | 비고 |
|---|---|---|---|
| **FR-1.1'** | Community Dragon 을 데이터 소스로 사용 | **U1** | DDragon 미러 대체 |
| FR-1.2 | 파이프라인 미실행 전제 | — | 제약 조건 (작업 대상 아님) |
| FR-1.3 | `VITE_USE_MOCK=false` 유지 | — | 설정 유지 (작업 대상 아님) |
| **FR-2.1** | `StatisticsPage` 데이터 부재 시 전용 안내 | **U3** | |
| **FR-2.2** | `CompsPage`·`CompDetailPage` 동일 안내 | **U3** | |
| **FR-2.3** | 안내에 수집 방법 포함 | **U3** | |
| **FR-2.4** | 백엔드 폴백 응답을 "데이터 없음" 신호로 인식 | **U3** | |
| **FR-3.1** | `/api/champions` 가 특성을 채워 반환 | **U1** | |
| **FR-3.2** | `/api/items` 가 `component`/`combined` 구분 + `recipe` | **U1** | |
| **FR-3.3** | `/api/statistics` 의 `patch`·`tier` 처리 | **U3** | UQ2-B 로 U1→U3 이동 |
| **FR-3.4** | `pandas` 를 `requirements.txt` 에 추가 | **U1** | |
| **FR-3.5** | CDragon 응답 캐싱 | **U1** | |
| **FR-4.1** | Recharts 추가 | **U4** | |
| **FR-4.2** | `SummonerPage` 등수 분포 차트 | **U4** | 실데이터 차트 |
| **FR-4.3** | 평균 등수 · Top4율 요약 | **U4** | |
| **FR-4.4** | `LeaderboardPage` 시각화 (선택) | **U4** | 선택 항목 |
| **FR-4.5** | `StatisticsPage` 차트 컴포넌트만, 데이터 연결 유예 | **U4** | U3 이후 진행 |
| **FR-5.1** | `ChampionDetailPage` EmptyState → 실내용 | **U2** | |
| **FR-5.2** | `ChampionsPage` 특성 필터 동작 | **U2** | **코드 변경 없음 — 검증만** |
| **FR-5.3** | `ItemsPage` 분류 탭 · 조합법 동작 | **U2** | **코드 변경 없음 — 검증만** |
| **FR-5.4** | `CompDetailPage` 안내 상태 적용 | **U3** | FR-2.2 와 통합 |
| **FR-6.1** | 유닛 · 아이템 · 특성 아이콘 연결 | **U1** (생성) + **U5** (검증) | **특성 아이콘은 UQ1-C 로 제외** |
| **FR-6.2** | 아이콘 실패 시 텍스트 폴백 유지 | **U5** | 회귀 검증 |
| **FR-6.3** | DDragon 버전 참조 일원화 | **U5** | |
| **FR-7.1** | 수정한 파일에 한해 `gold` → `brand` | **U5** | 다른 유닛 결과 위에 수행 |
| **FR-7.2** | `SearchBar` Riot ID 파싱 | **U5** | |

### 배정 검증

| 상태 | 개수 |
|---|---|
| 유닛에 배정됨 | 22 |
| 제약 조건 (작업 대상 아님) | 2 (FR-1.2, FR-1.3) |
| **미배정** | **0** ✅ |

---

## 2. 비기능 요구사항 → 유닛 매핑

| NFR | 요구사항 | 적용 유닛 | 방식 |
|---|---|---|---|
| **NFR-1** | `npm run dev` 로 12개 라우트 정상 렌더 | 전 유닛 | Build and Test 에서 최종 확인 |
| **NFR-2** | 신규 · 변경 코드에 단위 테스트 | 전 유닛 | 각 유닛 Code Generation 에 포함 |
| **NFR-3** | `npm run typecheck` 통과 | 전 유닛 | 각 유닛 완료 시 확인 |
| **NFR-4** | 기존 패턴 준수 (`QueryBoundary`·React Query·Tailwind 토큰) | U2, U3, U4, U5 | 설계 제약 |
| **NFR-5** | 반응형 유지 | U3, U4 | 신규 컴포넌트에 적용 |
| **NFR-6** | 목 모드 회귀 방지 | 전 유닛 | **계약 불변으로 자동 충족**, Build and Test 에서 검증 |
| **NFR-7** | Riot 레이트리밋 정책 우회 금지 | U4 | `riot_live.py` 미수정으로 자동 충족 |

---

## 3. 유닛별 요구사항 집계

| Unit | FR | NFR | 총계 |
|---|---|---|---|
| **U1** | FR-1.1', 3.1, 3.2, 3.4, 3.5, 6.1(생성) | NFR-2, 3 | **8** |
| **U3** | FR-2.1, 2.2, 2.3, 2.4, 3.3, 5.4 | NFR-2, 3, 4, 5 | **10** |
| **U4** | FR-4.1, 4.2, 4.3, 4.4, 4.5 | NFR-2, 3, 4, 5, 7 | **10** |
| **U2** | FR-5.1, 5.2, 5.3 | NFR-2, 3, 4 | **6** |
| **U5** | FR-6.1(검증), 6.2, 6.3, 7.1, 7.2 | NFR-2, 3, 4 | **8** |

> **U2 가 가장 가벼운 이유**: FR-5.2·FR-5.3 이 **코드 변경 없이 검증만** 필요하기 때문이다
> (`ChampionsPage`·`ItemsPage` 가 이미 구현되어 있음 — DQ8-A).

---

## 4. 범위 밖 요구사항 (추적용)

이번 작업에서 다루지 않기로 명시된 항목들. 향후 참조를 위해 기록한다.

| 항목 | 사유 | 근거 |
|---|---|---|
| 파이프라인 실행 | 사용자 결정 | Q5-C |
| `ml/` 구현 | 범위 밖 | Q3 |
| `dataset.py`·`riot_live.py` 수정 | 범위 한정 | CQ2-A |
| 배포 · 인프라 · CI | 로컬 기준 완료 | Q8-A |
| DB 도입 | 범위 밖 | requirements §5 |
| 기존 코드 포괄 테스트 | 신규/변경분만 | CQ5-B |
| 보안 · 복원력 · PBT 확장 | 비활성 | CQ6-B, CQ7-B, CQ8-C |
| `gold`→`brand` 28개 파일 일괄 치환 | 점진 처리 | CQ3-C |
| **특성 아이콘** | 계약 변경 회피 | **UQ1-C** |
| **`UnitList` 목 데이터 의존 제거** | U5 선택 항목 | 계획 중 발견 |

---

## 5. 추적성 요약

```
requirements.md (24 FR + 7 NFR)
        ↓
execution-plan.md (5 유닛 골격)
        ↓
application-design.md (9 컴포넌트: 신규 3 + 변경 6)
        ↓
unit-of-work.md (5 유닛 확정, 실행 순서 U1→U3→U4→U2→U5)
        ↓
[다음] Functional Design (U1, U2) → Code Generation (전 유닛) → Build and Test
```

**모든 FR 이 유닛에 배정되었고, 미배정 항목은 없다.**
