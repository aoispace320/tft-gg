import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Match } from '@/types/domain';
import { PlacementChart, summarize } from './PlacementChart';

function match(placement: number, id = String(placement)): Match {
  return { id, placement, comp: '테스트 조합', playedAt: '2026-08-01T00:00:00Z' };
}

describe('summarize', () => {
  it('빈 목록이면 0 을 돌려준다', () => {
    expect(summarize([])).toEqual({ avgPlacement: 0, top4Rate: 0, count: 0 });
  });

  it('평균 등수를 계산한다', () => {
    expect(summarize([match(1), match(3)]).avgPlacement).toBe(2);
  });

  it('Top4 비율을 계산한다 — 4등은 포함, 5등은 제외', () => {
    const got = summarize([match(1), match(4, 'a'), match(5, 'b'), match(8, 'c')]);
    expect(got.top4Rate).toBe(0.5);
  });

  it('등수 범위를 벗어난 매치는 표본에서 제외한다', () => {
    const got = summarize([match(1), match(0, 'zero'), match(9, 'nine')]);
    expect(got.count).toBe(1);
    expect(got.avgPlacement).toBe(1);
  });
});

describe('PlacementChart', () => {
  it('매치가 없으면 안내 문구를 보여준다', () => {
    render(<PlacementChart matches={[]} />);
    expect(screen.getByTestId('placement-chart-empty')).toBeInTheDocument();
  });

  it('매치가 있으면 차트를 렌더한다', () => {
    render(<PlacementChart matches={[match(1), match(5, 'x')]} />);
    expect(screen.getByTestId('placement-chart')).toBeInTheDocument();
  });
});
