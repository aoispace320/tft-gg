# tft-gg frontend

롤토체스 전적·통계·메타 정보 서비스의 프론트엔드 (React + TypeScript + Vite).
PRD 1차 범위(**F1 스캐폴딩 + F2 디자인 시스템 + F3 스켈레톤 UI**)를 구현한다.

## 기술 스택
- React 18 + TypeScript, Vite 6
- React Router v6 (7탭 라우팅)
- TanStack Query (서버 상태 · 로딩/에러 표준화)
- Tailwind CSS (§3 디자인 토큰 매핑)
- Axios (`src/api/`), 미설정 시 `src/mocks/` 목 데이터로 폴백
- Vitest + React Testing Library

## 실행
```bash
cd frontend
npm install
cp .env.example .env      # 선택: 값 미설정 시 자동 목 모드
npm run dev               # http://localhost:5173
```

## 스크립트
| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사만 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run test` | Vitest 단위 테스트 |

## 목/실 API 전환
- `.env` 의 `VITE_API_BASE_URL` 이 비었거나 `VITE_USE_MOCK=true` → **목 모드** (`src/api/client.ts` 의 `USE_MOCK`).
- 백엔드 준비 후 `VITE_API_BASE_URL` 지정 + `VITE_USE_MOCK=false` → 실 API 연동. 컴포넌트 변경 없이 전환.
- 데모: 전적검색에서 `error` 입력 → 에러 상태, `empty` 입력 → 빈 상태 확인.

## 디렉토리 (§5)
```
src/
  api/         엔드포인트 클라이언트 + 목 폴백
  components/  layout · common · feedback · domain
  config/      네비게이션 · 지역 상수
  hooks/       React Query 훅
  lib/         ddragon · format · queryClient
  mocks/       목 데이터
  pages/       탭별 페이지
  theme/       디자인 토큰(CSS 변수)
  types/       도메인 타입 (API 소비 계약)
```
