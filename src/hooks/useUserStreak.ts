import { useQuery } from '@tanstack/react-query';
import { streakService } from '../services/streak.service';
import { queryKeys } from '../utils/queryKeys';

export function useUserStreak() {
  return useQuery({
    queryKey: queryKeys.userStreak,
    queryFn: () => streakService.fetchCurrentUserStreak(),
  });
}
