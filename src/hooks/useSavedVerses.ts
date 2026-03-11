import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  savedVersesService,
  type SaveVersePayload,
} from '../services/savedVerses.service';
import { queryKeys } from '../utils/queryKeys';

export function useSavedVerses() {
  return useQuery({
    queryKey: queryKeys.savedVerses,
    queryFn: () => savedVersesService.fetchUserSavedVerses(),
  });
}

export function useSaveVerse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveVersePayload) => savedVersesService.saveVerse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedVerses });
    },
  });
}

export function useDeleteSavedVerse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedVersesService.deleteSavedVerse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedVerses });
    },
  });
}
