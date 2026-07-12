import { useQuery } from '@tanstack/react-query';
import { fetchComps } from '@/api/comps';

export function useComps() {
  return useQuery({
    queryKey: ['comps'],
    queryFn: fetchComps,
  });
}
