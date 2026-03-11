import { useQuery } from '@tanstack/react-query';
import { dailyVerseService } from '../services/dailyVerse.service';

export function useDailyVerse() {
  return useQuery({
    queryKey: ['daily-verse'],
    queryFn: () => dailyVerseService.getDailyVerse(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
