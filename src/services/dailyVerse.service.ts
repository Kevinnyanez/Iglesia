import type { BibleVerse } from '../types/models';
import { bibleService } from './bible.service';

const STORAGE_KEY = 'daily-verse-cache-v2-es';

interface DailyVerseCache {
  date: string;
  verse: BibleVerse;
}

const fallbackReferences = [
  'Juan 3:16',
  'Filipenses 4:13',
  'Romanos 8:28',
  'Salmos 23:1',
  'Isaias 41:10',
  'Josue 1:9',
  'Mateo 11:28',
  'Proverbios 3:5',
  'Salmos 27:1',
  'Salmos 46:1',
  'Salmos 121:1-2',
  'Jeremias 29:11',
  'Lamentaciones 3:22-23',
  'Mateo 6:33',
  'Mateo 28:20',
  'Juan 14:6',
  'Juan 16:33',
  '2 Corintios 5:17',
  'Gálatas 2:20',
  'Efesios 2:8-9',
  'Hebreos 11:1',
  '1 Pedro 5:7',
  '1 Juan 4:18',
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickReferenceForToday(): string {
  const key = getTodayKey(); // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const index = hash % fallbackReferences.length;
  return fallbackReferences[index];
}

export const dailyVerseService = {
  async getDailyVerse(): Promise<BibleVerse | null> {
    const today = getTodayKey();
    const rawCache = localStorage.getItem(STORAGE_KEY);

    if (rawCache) {
      try {
        const parsed = JSON.parse(rawCache) as DailyVerseCache;
        if (parsed.date === today && parsed.verse?.reference && parsed.verse?.text) {
          return parsed.verse;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const reference = pickReferenceForToday();
    const verse = await bibleService.fetchVerseByReference(reference);
    if (!verse) {
      return null;
    }

    // Keep the daily verse reference in Spanish in the hero UI.
    verse.reference = reference;

    const payload: DailyVerseCache = { date: today, verse };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return verse;
  },
};
