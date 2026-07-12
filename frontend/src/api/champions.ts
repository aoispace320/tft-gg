import type { Champion } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockChampions } from '@/mocks/champions';

export async function fetchChampions(): Promise<Champion[]> {
  if (USE_MOCK) return withMockDelay(mockChampions);
  const { data } = await http.get<Champion[]>('/champions');
  return data;
}
