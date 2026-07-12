import type { Item } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockItems } from '@/mocks/items';

export async function fetchItems(): Promise<Item[]> {
  if (USE_MOCK) return withMockDelay(mockItems);
  const { data } = await http.get<Item[]>('/items');
  return data;
}
