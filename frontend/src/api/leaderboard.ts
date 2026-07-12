import type { LeaderboardResponse } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockLeaderboard } from '@/mocks/leaderboard';

export async function fetchLeaderboard(
  region: string,
  tier: string,
  page: number,
): Promise<LeaderboardResponse> {
  if (USE_MOCK) return withMockDelay(mockLeaderboard(page));
  const { data } = await http.get<LeaderboardResponse>('/leaderboard', {
    params: { region, tier, page },
  });
  return data;
}
