import type { SummonerResponse } from '@/types/domain';
import { http, USE_MOCK, withMockDelay } from './client';
import { mockSummoner } from '@/mocks/summoner';

export async function fetchSummoner(
  region: string,
  name: string,
): Promise<SummonerResponse> {
  if (USE_MOCK) {
    // 데모: 'error' 를 검색하면 에러 상태, 'empty' 를 검색하면 빈 상태 확인 가능.
    if (name.toLowerCase() === 'error') throw new Error('소환사 정보를 불러오지 못했습니다.');
    const data = mockSummoner(region, name);
    if (name.toLowerCase() === 'empty') data.matches = [];
    return withMockDelay(data);
  }
  const { data } = await http.get<SummonerResponse>(
    `/summoner/${region}/${encodeURIComponent(name)}`,
  );
  return data;
}
