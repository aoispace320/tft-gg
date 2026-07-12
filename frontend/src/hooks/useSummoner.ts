import { useQuery } from '@tanstack/react-query';
import { fetchSummoner } from '@/api/summoner';

export function useSummoner(region?: string, name?: string) {
  return useQuery({
    queryKey: ['summoner', region, name],
    queryFn: () => fetchSummoner(region!, name!),
    enabled: Boolean(region && name),
  });
}
