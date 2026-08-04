# Reverse Engineering Metadata

**Analysis Date**: 2026-08-03T14:15:06Z
**Analyzer**: AI-DLC
**Workspace**: C:\Users\samgj\Desktop\tfg_gg
**Git HEAD at analysis**: 1d05ca8 — "파일 수정"
**Analysis note**: 초기 분석은 8ff7a33 기준으로 수행했고, 이후 `git pull` 로 1d05ca8 까지 fast-forward
(충돌 없음). 유입 변경은 `docs/260725_UI_개편_설명서.md` 신규 추가와 `frontend/dist/` 빌드 산출물 갱신뿐이며,
`frontend/src/` · `backend/` · `pipeline/` 소스는 변경되지 않았다. 새 문서 내용을 반영해
business-overview.md · code-structure.md · technology-stack.md · code-quality-assessment.md 를 갱신했다.
**Total Files Analyzed**: 약 95개 소스·설정 파일 (`node_modules/`, `.git/`, `dist/`, `.aidlc-rule-details/` 제외)

| 영역 | 파일 수 | 대략 줄수 |
|------|---------|-----------|
| frontend/src | 71 | 2,906 |
| backend/app | 6 | ~730 |
| pipeline | 8 | ~350 |
| ml | 0 (`.gitkeep` 3개) | 0 |
| docs · 설정 | ~10 | - |

## Artifacts Generated

- [x] business-overview.md
- [x] architecture.md
- [x] code-structure.md
- [x] api-documentation.md
- [x] component-inventory.md
- [x] technology-stack.md
- [x] dependencies.md
- [x] code-quality-assessment.md

## Analysis Scope Notes

- 정적 분석만 수행했다. 애플리케이션을 **실행하거나 테스트를 돌리지는 않았다**.
- `data/` 디렉토리가 존재하지 않아 실제 데이터 형태는 코드(`preprocess.py` 의 컬럼 정의)에서 역추론했다.
- `backend/app/cli.py`, `pipeline/collector/{collect,riot_client,ddragon}.py`, `pipeline/run.py` 는
  파일 목록·README·호출 관계로 역할을 파악했으며 전문(全文)을 읽지는 않았다.
- frontend 40개 컴포넌트 중 페이지 4개(`ChampionDetailPage`, `CompDetailPage`, `StatisticsPage`, `ArenaPage`)와
  진입점·타입·API 계층은 전문을 읽었고, 나머지는 줄수·import 관계로 역할을 판단했다.

## Staleness Check

이 산출물은 위 Git HEAD 시점의 코드베이스를 반영한다.
이후 커밋이 쌓이면 Workspace Detection 단계에서 stale 판정되어 재실행 대상이 된다.
