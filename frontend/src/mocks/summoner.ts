import type { SummonerResponse } from '@/types/domain';
import { profileIcon } from '@/lib/ddragon';

const comps = ['영혼 마법사', '결투가 리롤', '공허 사수', '그림자 암살자', '수호자 탱커', '빛의 인도자'];

export function mockSummoner(region: string, name: string): SummonerResponse {
  const matches = Array.from({ length: 12 }, (_, i) => ({
    id: `m${i}`,
    placement: ((i * 3 + 1) % 8) + 1,
    comp: comps[i % comps.length],
    playedAt: new Date(Date.parse('2026-07-12T12:00:00Z') - i * 3600_000 * 5).toISOString(),
    queue: 'ranked',
  }));

  return {
    name: decodeURIComponent(name),
    region: region.toUpperCase(),
    tier: 'Diamond II',
    lp: 42,
    level: 187,
    iconUrl: profileIcon(29),
    matches,
  };
}
