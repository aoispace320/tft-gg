# U1 Code Generation Plan — 백엔드 정적 데이터 소스 교체

**작성일**: 2026-08-04
**Unit**: U1 | **패키지**: `backend/` | **Workspace Root**: `C:\Users\samgj\Desktop\tfg_gg`
**설계 출처**: `aidlc-docs/construction/U1/functional-design/`

---

## 유닛 컨텍스트

| 항목 | 내용 |
|---|---|
| **구현 요구사항** | FR-1.1', FR-3.1, FR-3.2, FR-3.4, FR-3.5, FR-6.1(생성분) / NFR-2, NFR-3 |
| **선행 의존** | 없음 |
| **이 유닛에 의존** | U2 (traits·recipe), U5 (iconUrl) |
| **제공 인터페이스** | `static_data.champions() -> list[dict]`, `static_data.items() -> list[dict]` |
| **계약** | `frontend/src/types/domain.ts` 의 `Champion`·`Item` — **변경 금지** |
| **소유 엔티티** | Champion, Item, CDragonSnapshot(내부) |

**브라운필드 원칙**: 기존 파일은 **제자리 수정**한다. `static_data_new.py` 같은 사본을 만들지 않는다.

---

## 실행 단계

### Step 1 — Gateway 생성 (Business Logic)
- [x] `backend/app/services/cdragon.py` **신규 생성**
- [x] 3단 캐시 (메모리 → 디스크 → 원격) — BR-6
- [x] `data/cache/cdragon_set{N}.json` 추출 저장, TTL 24시간 — BR-6.2
- [x] `asset_url()` 변환 — BR-4
- [x] `set_number()` 환경변수 처리 — BR-5
- [x] 전 함수 예외 비전파 — BR-7

### Step 2 — 도메인 조립기 재작성 (Business Logic)
- [x] `backend/app/services/static_data.py` **제자리 수정**
- [x] DDragon 로컬 미러 경로 및 `_load()` **완전 제거** — DQ3-A
- [x] `champions()` — BR-1 선별, BR-3.1 변환
- [x] `items()` — BR-2 2패스 선별, BR-3.2 변환
- [x] `lru_cache` 판단 근거 주석 기록 — BR-8

### Step 3 — 설정 파일 (Deployment Artifacts)
- [x] `backend/requirements.txt` — `pandas` 추가 (FR-3.4), `pytest` 추가 (NFR-2)
- [x] `.env.example` — `TFT_SET` 문서화 (BR-5)

### Step 4 — 단위 테스트 (Business Logic Unit Testing, NFR-2)
- [x] `backend/tests/__init__.py`
- [x] `backend/tests/conftest.py` — 샘플 스냅샷 픽스처
- [x] `backend/tests/test_cdragon.py` — `asset_url`, 세트 결정, 폴백
- [x] `backend/tests/test_static_data.py` — 선별·변환·무결성 규칙

### Step 5 — 검증
- [x] 순수 함수 직접 실행 검증
- [x] 실제 CDragon 연동 검증 (챔피언·아이템 개수 확인)
- [x] FastAPI 앱 임포트 및 엔드포인트 응답 확인
- [x] 네트워크 실패 시 degrade 확인

### Step 6 — 문서 (Documentation)
- [x] `aidlc-docs/construction/U1/code/implementation-summary.md`

---

## 요구사항 추적

| FR | 구현 위치 | 상태 |
|---|---|---|
| FR-1.1' Community Dragon 소스 | `cdragon.py` | [x] |
| FR-3.1 챔피언 traits | `static_data.champions()` | [x] |
| FR-3.2 아이템 type·recipe | `static_data.items()` | [x] |
| FR-3.4 pandas 선언 | `requirements.txt` | [x] |
| FR-3.5 캐싱 | `cdragon._load_or_fetch()` | [x] |
| FR-6.1 iconUrl 생성 | `cdragon.asset_url()` | [x] |
| NFR-2 단위 테스트 | `backend/tests/` | [x] |
| NFR-3 타입 안전성 | 타입 힌트 | [x] |

---

## 완료 기준

- [x] `/api/champions` 가 비어 있지 않은 `traits` 와 `iconUrl` 반환
- [x] `/api/items` 가 `component`·`combined` 모두 포함, `recipe` 제공
- [x] 네트워크 차단 시 500 이 아닌 빈 목록
- [x] 재시작 시 디스크 캐시로 즉시 응답
- [x] 중복 파일 없음 (제자리 수정 확인)
