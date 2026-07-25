/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // §3.1 컬러 토큰 (op.gg / lolchess.gg 참고 — 모던 다크 + 블루 포인트)
        bg: {
          base: '#1C1C1F',
          surface: '#28282C',
          elevated: '#31313C',
        },
        // 브랜드 포인트 (op.gg 블루). 기존 클래스명 호환을 위해 gold 이름 유지.
        brand: {
          DEFAULT: '#5383E8',
          bright: '#9CB8F5',
        },
        gold: {
          DEFAULT: '#5383E8',
          bright: '#EBEEF1',
        },
        teal: {
          DEFAULT: '#00BBA3',
        },
        // 승/패 지표 색 (op.gg 승률 색상)
        win: '#5383E8',
        lose: '#E84057',
        text: {
          primary: '#EBEEF1',
          muted: '#9AA4AF',
        },
        line: '#3C3C41',
        // §3.3 티어 색상 (랭크)
        tier: {
          challenger: '#F4C874',
          grandmaster: '#DD4C4C',
          master: '#9D4DC3',
          diamond: '#576BCE',
          emerald: '#0AC8B9',
          platinum: '#4E9996',
          gold: '#C8AA6E',
          silver: '#8896A0',
          bronze: '#8C5A3C',
          iron: '#5C5C5C',
        },
        // §3.3 조합/챔피언 티어 배지 (S/A/B/C/D — lolchess 메타 티어 팔레트)
        rank: {
          s: '#E84057',
          a: '#F19000',
          b: '#EBBC00',
          c: '#5CB100',
          d: '#8896A0',
        },
        // 챔피언 코스트 색상 (TFT 표준)
        cost: {
          1: '#848999',
          2: '#11B288',
          3: '#207AC7',
          4: '#C440DA',
          5: '#F4C874',
        },
      },
      fontFamily: {
        // op.gg 계열 — 전면 산세리프 (헤드라인도 동일 패밀리, 굵기로 위계)
        display: ['Inter', 'Noto Sans KR', 'system-ui', 'Segoe UI', 'sans-serif'],
        sans: ['Inter', 'Noto Sans KR', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
      },
      boxShadow: {
        'teal-glow': '0 4px 16px -4px rgba(0, 0, 0, 0.45)',
        'gold-glow': '0 0 0 2px rgba(83, 131, 232, 0.35)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
