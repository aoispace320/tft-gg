import { useQuery } from '@tanstack/react-query';
import { fetchChampions } from '@/api/champions';

export function useChampions() {
  return useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
  });
}
