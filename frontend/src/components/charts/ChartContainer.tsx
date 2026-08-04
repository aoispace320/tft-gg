import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { classNames } from '@/lib/format';

/** 차트 공통 색상. tailwind.config.js 의 토큰 값과 맞춘다(Recharts 는 CSS 클래스를 못 받는다). */
export const CHART_COLORS = {
  brand: '#5383E8',
  brandBright: '#9CB8F5',
  teal: '#00BBA3',
  win: '#5383E8',
  lose: '#E84057',
  line: '#3C3C41',
  textMuted: '#9AA4AF',
  surface: '#28282C',
} as const;

/** 축·툴팁 공통 스타일. 각 차트에서 spread 해 쓴다. */
export const axisStyle = {
  stroke: CHART_COLORS.line,
  tick: { fill: CHART_COLORS.textMuted, fontSize: 12 },
  tickLine: false,
} as const;

export const tooltipStyle = {
  contentStyle: {
    background: CHART_COLORS.surface,
    border: `1px solid ${CHART_COLORS.line}`,
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: CHART_COLORS.textMuted },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
} as const;

interface ChartContainerProps {
  children: ReactElement;
  /** 고정 높이(px). 너비는 부모에 맞춰 반응형으로 늘어난다. */
  height?: number;
  className?: string;
}

/**
 * Recharts ResponsiveContainer 래퍼.
 *
 * 차트마다 ResponsiveContainer 와 테마 상수를 반복하지 않도록 한 겹 감쌌다.
 * 너비는 100% 라 부모 그리드에 따라 반응형으로 동작한다 (NFR-5).
 */
export function ChartContainer({ children, height = 240, className }: ChartContainerProps) {
  return (
    <div className={classNames('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
