/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // §3.1 컬러 토큰 (LoL 딥 틸 + 골드 다크 테마)
        bg: {
          base: '#0A1428',
          surface: '#0F2027',
          elevated: '#132B34',
        },
        gold: {
          DEFAULT: '#C8AA6E',
          bright: '#F0E6D2',
        },
        teal: {
          DEFAULT: '#0AC8B9',
        },
        text: {
          primary: '#F0E6D2',
          muted: '#A09B8C',
        },
        line: '#785A28',
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
        // §3.3 조합/챔피언 티어 배지 (S/A/B/C/D)
        rank: {
          s: '#FF7676',
          a: '#F0A868',
          b: '#F0E6D2',
          c: '#68C3F0',
          d: '#8896A0',
        },
        // 챔피언 코스트 색상
        cost: {
          1: '#8B8B8B',
          2: '#1BC868',
          3: '#0A8FE0',
          4: '#C13FD6',
          5: '#F4C874',
        },
      },
      fontFamily: {
        // §3.2 헤드라인 세리프(Beaufort 대체 Spectral), 본문 산세리프
        display: ['Spectral', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        // §3.2 4px 스케일 (기본 tailwind 스케일이 이미 4px 기준)
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
      },
      boxShadow: {
        'teal-glow': '0 0 0 1px rgba(120, 90, 40, 0.6), 0 0 16px -4px rgba(10, 200, 185, 0.25)',
        'gold-glow': '0 0 12px -2px rgba(200, 170, 110, 0.35)',
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
