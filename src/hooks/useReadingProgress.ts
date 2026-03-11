import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readingProgressService, type MarkAsReadPayload } from '../services/readingProgress.service';
import { queryKeys } from '../utils/queryKeys';
import { useAuth } from './useAuth';

export function useReadingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.readingProgress(user?.id ?? ''),
    queryFn: () => readingProgressService.listByCurrentUser(),
    enabled: Boolean(user?.id),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: MarkAsReadPayload) => readingProgressService.markAsRead(payload),
    onSuccess: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readingProgress(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStreak });
    },
  });
}
