import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/api/leaderboard';

export function useLeaderboard(region: string, tier: string, page: number) {
  return useQuery({
    queryKey: ['leaderboard', region, tier, page],
    queryFn: () => fetchLeaderboard(region, tier, page),
    placeholderData: keepPreviousData,
  });
}
