/**
 * Normaliza texto para búsqueda: quita puntuación y espacios.
 * "I.E.P.A" → "iepa", "Iepa" → "iepa"
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.\s\-_]/g, '');
}

export function matchesSearch(text: string | null | undefined, search: string): boolean {
  if (!text?.trim()) return false;
  const normalizedText = normalizeForSearch(text);
  const normalizedSearch = normalizeForSearch(search);
  if (!normalizedSearch) return true;
  return normalizedText.includes(normalizedSearch) || normalizedSearch.includes(normalizedText);
}
