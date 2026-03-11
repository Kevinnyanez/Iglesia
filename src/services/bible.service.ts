import type { BibleBook, BibleChapter, BibleVerse } from '../types/models';
import { getOptionalEnv } from '../utils/env';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

const bookAliasesToSpanishSlug: Record<string, string> = {
  genesis: 'genesis',
  gen: 'genesis',
  exodo: 'exodo',
  exodus: 'exodo',
  exod: 'exodo',
  levitico: 'levitico',
  leviticus: 'levitico',
  lev: 'levitico',
  numeros: 'numeros',
  numbers: 'numeros',
  num: 'numeros',
  deuteronomio: 'deuteronomio',
  deuteronomy: 'deuteronomio',
  deut: 'deuteronomio',
  josue: 'josue',
  joshua: 'josue',
  josh: 'josue',
  salmos: 'salmos',
  psalms: 'salmos',
  psalm: 'salmos',
  ps: 'salmos',
  proverbios: 'proverbios',
  proverbs: 'proverbios',
  prov: 'proverbios',
  isaias: 'isaias',
  isaiah: 'isaias',
  isa: 'isaias',
  jeremias: 'jeremias',
  jeremiah: 'jeremias',
  jer: 'jeremias',
  mateo: 'mateo',
  matthew: 'mateo',
  matt: 'mateo',
  marcos: 'marcos',
  mark: 'marcos',
  lucas: 'lucas',
  luke: 'lucas',
  juan: 'juan',
  john: 'juan',
  hechos: 'hechos',
  acts: 'hechos',
  romanos: 'romanos',
  romans: 'romanos',
  rom: 'romanos',
  filipenses: 'filipenses',
  philippians: 'filipenses',
  phil: 'filipenses',
};

async function bibleRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getOptionalEnv('VITE_BIBLE_API_BASE_URL') ?? 'https://bible-api.com';
  const apiKey = getOptionalEnv('VITE_BIBLE_API_KEY');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Bible API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function getBibleTranslation() {
  return getOptionalEnv('VITE_BIBLE_API_TRANSLATION') ?? 'rvr1960';
}

function getSpanishBibleBaseUrl() {
  return getOptionalEnv('VITE_BIBLE_API_SPANISH_BASE_URL') ?? 'https://bible-api.deno.dev';
}

function normalizeSpanishTranslation() {
  const translation = getBibleTranslation().toLowerCase();
  if (translation === 'rvr1960' || translation === 'rv1960') return 'rv1960';
  if (translation === 'rvr1995' || translation === 'rv1995') return 'rv1995';
  if (translation === 'nvi') return 'nvi';
  return 'rv1960';
}

function normalizeBookSlug(book: string) {
  const cleaned = book
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  return bookAliasesToSpanishSlug[cleaned] ?? cleaned.replace(/\s+/g, '-');
}

function parseReference(reference: string): { bookSlug: string; chapter: number; verse: number } | null {
  const trimmed = reference.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const [, rawBook, rawChapter, rawVerse] = match;
  const chapter = Number(rawChapter);
  const verse = Number(rawVerse);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  return {
    bookSlug: normalizeBookSlug(rawBook),
    chapter,
    verse,
  };
}

export const bibleService = {
  fetchBooks() {
    return bibleRequest<BibleBook[]>('/books');
  },

  fetchChapters(bookId: string) {
    return bibleRequest<BibleChapter[]>(`/books/${bookId}/chapters`);
  },

  fetchVerses(chapterId: string) {
    return bibleRequest<BibleVerse[]>(`/chapters/${chapterId}/verses`);
  },

  searchVerses(query: string) {
    const encodedQuery = encodeURIComponent(query);
    return bibleRequest<BibleVerse[]>(`/search?query=${encodedQuery}`);
  },

  async fetchVerseByReference(reference: string): Promise<BibleVerse | null> {
    const parsed = parseReference(reference);
    if (!parsed) return null;
    const baseUrl = getSpanishBibleBaseUrl();
    const translation = normalizeSpanishTranslation();
    const response = await fetch(
      `${baseUrl}/api/read/${encodeURIComponent(translation)}/${encodeURIComponent(parsed.bookSlug)}/${parsed.chapter}/${parsed.verse}`,
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { verse?: string };
    if (!payload.verse) {
      return null;
    }

    return {
      id: reference,
      reference: reference.trim(),
      text: payload.verse.trim(),
    };
  },

  async fetchChapter(book: string, chapter: number): Promise<BibleVerse[]> {
    const baseUrl = getSpanishBibleBaseUrl();
    const translation = normalizeSpanishTranslation();
    const bookSlug = normalizeBookSlug(book);
    const response = await fetch(`${baseUrl}/api/read/${encodeURIComponent(translation)}/${encodeURIComponent(bookSlug)}/${chapter}`);

    if (!response.ok) {
      throw new Error('No fue posible cargar el capítulo bíblico.');
    }

    const payload = (await response.json()) as {
      name?: string;
      chapter?: number;
      vers?: Array<{ number?: number; verse?: string; id?: number }>;
    };

    const verses = payload.vers ?? [];
    return verses
      .filter((item) => item.number && item.verse)
      .map((item) => ({
        id: String(item.id ?? `${bookSlug}-${chapter}-${item.number}`),
        reference: `${payload.name ?? book} ${payload.chapter ?? chapter}:${item.number}`,
        text: (item.verse ?? '').trim(),
      }));
  },
};
