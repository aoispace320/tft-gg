import type { MetaStats } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockStatistics } from '@/mocks/statistics';

export async function fetchStatistics(
  patch?: string,
  tier?: string,
): Promise<MetaStats> {
  if (USE_MOCK) return withMockDelay(mockStatistics);
  const { data } = await http.get<MetaStats>('/statistics', {
    params: { patch, tier },
  });
  return data;
}
