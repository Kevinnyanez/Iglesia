import { useQuery } from '@tanstack/react-query';
import { bibleService } from '../services/bible.service';
import { queryKeys } from '../utils/queryKeys';

export function useBibleBooks() {
  return useQuery({
    queryKey: queryKeys.bibleBooks,
    queryFn: () => bibleService.fetchBooks(),
  });
}

export function useBibleChapters(bookId?: string) {
  return useQuery({
    queryKey: queryKeys.bibleChapters(bookId ?? ''),
    queryFn: () => bibleService.fetchChapters(bookId as string),
    enabled: Boolean(bookId),
  });
}

export function useBibleVerses(chapterId?: string) {
  return useQuery({
    queryKey: queryKeys.bibleVerses(chapterId ?? ''),
    queryFn: () => bibleService.fetchVerses(chapterId as string),
    enabled: Boolean(chapterId),
  });
}

export function useBibleSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.bibleSearch(query),
    queryFn: () => bibleService.searchVerses(query),
    enabled: query.trim().length >= 3,
  });
}

export function useBibleReference(reference?: string) {
  return useQuery({
    queryKey: queryKeys.bibleReference(reference ?? ''),
    queryFn: () => bibleService.fetchVerseByReference(reference as string),
    enabled: Boolean(reference?.trim()),
  });
}
