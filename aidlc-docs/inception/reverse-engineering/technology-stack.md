# Technology Stack

## Programming Languages

| 언어 | 버전 | 사용처 |
|------|------|--------|
| TypeScript | 5.7.2 | `frontend/` 전체 (71개 파일) |
| Python | 3.10+ (코드가 `str \| None` PEP 604 문법 사용) | `backend/`, `pipeline/` |
| CSS | - | `index.css`, `theme/tokens.css` (+ Tailwind 유틸리티) |

## Frameworks

| 프레임워크 | 버전 | 목적 |
|-----------|------|------|
| React | 18.3.1 | 프론트엔드 UI |
| React Router | 6.28.0 | SPA 라우팅 (`createBrowserRouter`) |
| TanStack Query (React Query) | 5.62.0 | 서버 상태 · 캐싱 · 로딩/에러 표준화 |
| Tailwind CSS | 3.4.17 | 스타일링. 커스텀 컬러 토큰으로 디자인 시스템 구현. **현재 팔레트는 op.gg 풍 모던 다크(`#1C1C1F` 배경 + `#5383E8` 블루)** — PRD §3 의 딥 틸+골드에서 2026-07-25 개편으로 교체됨 |
| FastAPI | 미고정 (`requirements.txt` 에 버전 없음) | 백엔드 REST API |

## Libraries

| 라이브러리 | 버전 | 목적 |
|-----------|------|------|
| axios | 1.7.9 | HTTP 클라이언트 (`api/client.ts` 단일 인스턴스, timeout 10초) |
| requests | 미고정 | Python HTTP (Riot API 호출) |
| python-dotenv | 미고정 | `.env` 에서 `riot_api_key` 로드 |
| pandas | **미선언** | CSV 처리 · 멀티핫 인코딩. `dataset.py` · `preprocess.py` 가 사용하나 어떤 requirements 에도 없음 |
| PostCSS | 8.4.49 | Tailwind 처리 |
| autoprefixer | 10.4.20 | 벤더 프리픽스 |

## Build Tools

| 도구 | 버전 | 목적 |
|------|------|------|
| Vite | 6.0.5 | 프론트엔드 dev 서버(HMR) · 프로덕션 번들 |
| @vitejs/plugin-react | 4.3.4 | React Fast Refresh |
| tsc | 5.7.2 | 타입 검사 (`tsc -b`, 프로젝트 레퍼런스 구성) |
| npm | - | 프론트엔드 패키지 관리 |
| pip | - | Python 패키지 관리 (`backend/requirements.txt`) |
| uvicorn | 미고정 | ASGI 서버 |

## Testing Tools

| 도구 | 버전 | 목적 | 실사용 |
|------|------|------|--------|
| Vitest | 3.2.4 | 프론트엔드 테스트 러너 | 테스트 1개 |
| @testing-library/react | 16.1.0 | 컴포넌트 렌더 테스트 | 테스트 1개 |
| @testing-library/jest-dom | 6.6.3 | DOM 매처 | `test/setup.ts` |
| jsdom | 25.0.1 | 브라우저 환경 시뮬레이션 | Vitest 환경 |
| pytest 등 Python 테스트 | **없음** | - | **0건** |

## Infrastructure & External Services

| 항목 | 상태 |
|------|------|
| 데이터베이스 | **없음.** 루트 README 는 PostgreSQL 이라 명시하나 구현에 DB 연결 코드가 전혀 없다. 저장소는 파일시스템(JSONL / CSV / JSON) |
| 컨테이너 | `docker-compose.yml` 존재하나 **0바이트 빈 파일**. Dockerfile 없음 |
| 클라우드 / IaC | 없음 (CDK · Terraform · CloudFormation 모두 부재) |
| CI/CD | 없음 |
| Riot Games API | 외부 의존. `account-v1`, `tft/summoner-v1`, `tft/match-v1`, `tft/league-v1`. 개발용 키는 24시간 만료 |
| Riot Data Dragon | 외부 CDN. 챔피언/아이템/특성 JSON + 프로필 아이콘 이미지 |
| TFT_DDragon 로컬 미러 | `noxelisdev/TFT_DDragon` 저장소를 `data/TFT_DDragon/` 에 클론하는 방식. **현재 미설치** |

## Linting & Code Quality Tooling

| 항목 | 상태 |
|------|------|
| ESLint | **없음** (설정 파일 · 의존성 모두 부재) |
| Prettier | **없음** |
| TypeScript strict | `tsconfig.app.json` 로 관리 (검증 필요) |
| Python 린터 (ruff/flake8/black) | **없음** |
| pre-commit hooks | **없음** |
| 타입 검사 스크립트 | `npm run typecheck` (`tsc -b --noEmit`) — 유일한 자동 검사 수단 |

## Configuration

| 파일 | 내용 |
|------|------|
| `.env` (루트, git 제외) | `riot_api_key` — backend `riot_live.py`, pipeline 공용 |
| `.env.example` (루트) | `riot_api_key = 'riot_api_key_here'` |
| `frontend/.env` (git 제외) | `VITE_API_BASE_URL=http://localhost:8000/api`, `VITE_USE_MOCK=false`, `VITE_DDRAGON_VERSION=16.14.1` |
| `frontend/.env.example` | `VITE_API_BASE_URL=` (빈 값), `VITE_USE_MOCK=true`, `VITE_DDRAGON_VERSION=14.24.1` |
| `.claude/launch.json` | 개발 서버 정의 — frontend, `npm run dev`, 포트 5173 |
| `.gitignore` | `.env`, `__pycache__/`, `node_modules/`, `*.pyc`, `.DS_Store`, `data/`. **`frontend/dist/` 는 제외되지 않아 빌드 산출물이 커밋된다** |
| `frontend/index.html` | 폰트 로드 — Inter + Noto Sans KR (개편 전 Spectral 세리프에서 교체) |

> ⚠️ `.env.example` 과 실제 `.env` 의 `VITE_DDRAGON_VERSION` 이 다르다 (14.24.1 vs 16.14.1).
> 백엔드 `riot_live.py` 는 별도로 `DDRAGON_VERSION` 환경변수 또는 CDN 최신 버전 조회를 사용하며,
> 폴백 상수는 또 다른 값(`14.24.1`)이다. DDragon 버전이 **세 곳에서 따로 관리**된다.

## Runtime Ports

| 서비스 | 포트 | 기동 명령 |
|--------|------|-----------|
| frontend (Vite) | 5173 | `cd frontend && npm run dev` |
| backend (uvicorn) | 8000 | `cd backend && uvicorn app.main:app --reload --port 8000` |
