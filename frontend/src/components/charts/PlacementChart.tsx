import { useMemo } from 'react';
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import type { Match } from '@/types/domain';
import { ChartContainer, CHART_COLORS, axisStyle, tooltipStyle } from './ChartContainer';

/** TFT 는 8인전. 등수는 1~8 이며 낮을수록 좋다. 4등 이내가 Top4(사실상 승리). */
const PLACEMENTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const TOP4_CUTOFF = 4;

export interface PlacementSummary {
  avgPlacement: number;
  top4Rate: number;
  count: number;
}

/** 매치 목록에서 평균 등수 · Top4율을 계산한다. 빈 목록이면 0. */
export function summarize(matches: Match[]): PlacementSummary {
  const valid = matches.filter((m) => m.placement >= 1 && m.placement <= 8);
  if (valid.length === 0) return { avgPlacement: 0, top4Rate: 0, count: 0 };
  const total = valid.reduce((sum, m) => sum + m.placement, 0);
  const top4 = valid.filter((m) => m.placement <= TOP4_CUTOFF).length;
  return {
    avgPlacement: total / valid.length,
    top4Rate: top4 / valid.length,
    count: valid.length,
  };
}

interface PlacementChartProps {
  matches: Match[];
  height?: number;
  className?: string;
}

/**
 * 최근 매치의 등수 분포 막대 그래프.
 *
 * 이번 작업에서 실데이터로 동작하는 유일한 차트다 — 라이브 Riot API 를 쓰기 때문이다.
 * (통계·조합 차트는 전처리 데이터가 없어 유예되었다. FR-4.5)
 */
export function PlacementChart({ matches, height = 200, className }: PlacementChartProps) {
  const data = useMemo(() => {
    const counts = new Map<number, number>(PLACEMENTS.map((p) => [p, 0]));
    for (const m of matches) {
      if (counts.has(m.placement)) counts.set(m.placement, counts.get(m.placement)! + 1);
    }
    return PLACEMENTS.map((p) => ({ placement: `${p}등`, count: counts.get(p) ?? 0, rank: p }));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted" data-testid="placement-chart-empty">
        표시할 매치가 없습니다.
      </p>
    );
  }

  return (
    <div data-testid="placement-chart" className={className}>
      <ChartContainer height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <XAxis dataKey="placement" {...axisStyle} axisLine={{ stroke: CHART_COLORS.line }} />
          <YAxis allowDecimals={false} {...axisStyle} axisLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value ?? 0}판`, '횟수'] as [string, string]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              // Top4 는 브랜드 색, 5~8 등은 패배 색으로 구분한다.
              <Cell
                key={d.rank}
                fill={d.rank <= TOP4_CUTOFF ? CHART_COLORS.win : CHART_COLORS.lose}
                fillOpacity={d.count === 0 ? 0.18 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
