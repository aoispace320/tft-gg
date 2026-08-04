import type { MetaStats } from '@/types/domain';
import { mockComps } from './comps';

export const mockStatistics: MetaStats = {
  patch: '14.13',
  updatedAt: '2026-07-12T09:00:00Z',
  summary: [
    { id: 'games', label: '분석된 게임', value: '1,284,930', delta: 4.2 },
    { id: 'avg-top4', label: '평균 Top4 비율', value: '50.0%', delta: 0 },
    { id: 'meta-comps', label: '메타 조합 수', value: '32', delta: -2.1 },
    { id: 'active-augments', label: '활성 증강체', value: '214', delta: 1.4 },
  ],
  topAugments: [
    { id: 'a1', name: '전투 훈련 II', tier: 'gold', pickRate: 0.184, avgPlacement: 4.1 },
    { id: 'a2', name: '풍요의 뿔', tier: 'prismatic', pickRate: 0.121, avgPlacement: 3.8 },
    { id: 'a3', name: '연금술 소용돌이', tier: 'silver', pickRate: 0.203, avgPlacement: 4.5 },
    { id: 'a4', name: '최전선의 영웅', tier: 'gold', pickRate: 0.098, avgPlacement: 4.2 },
    { id: 'a5', name: '증강 마스터', tier: 'prismatic', pickRate: 0.066, avgPlacement: 3.9 },
  ],
  topComps: mockComps.slice(0, 5),
  // 목 모드에서는 데이터가 있는 상태를 가정한다 (NFR-6 회귀 방지).
  hasData: true,
  supportedFilters: { patch: true, tier: true },
};
