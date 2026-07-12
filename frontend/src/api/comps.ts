import type { Comp } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockComps } from '@/mocks/comps';

export async function fetchComps(): Promise<Comp[]> {
  if (USE_MOCK) return withMockDelay(mockComps);
  const { data } = await http.get<Comp[]>('/comps');
  return data;
}
