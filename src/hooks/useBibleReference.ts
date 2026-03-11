import { useQuery } from '@tanstack/react-query';
import { bibleService } from '../services/bible.service';

export function useBibleReference(reference?: string) {
  const normalizedReference = reference?.trim() ?? '';

  return useQuery({
    queryKey: ['bible-verse', normalizedReference],
    queryFn: () => bibleService.fetchVerseByReference(normalizedReference),
    enabled: normalizedReference.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
