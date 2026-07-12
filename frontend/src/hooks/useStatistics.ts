import { useQuery } from '@tanstack/react-query';
import { fetchStatistics } from '@/api/statistics';

export function useStatistics(patch?: string, tier?: string) {
  return useQuery({
    queryKey: ['statistics', patch, tier],
    queryFn: () => fetchStatistics(patch, tier),
  });
}
