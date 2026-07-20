import { dictionaryEntries as fallbackEntries } from '../constants/MockData';
import type { DictionaryEntry } from '../types';
import { apiRequest, resolveApiUrl } from './api';

let cachedEntries: DictionaryEntry[] | null = null;

const normalizeEntry = (entry: DictionaryEntry): DictionaryEntry => ({
  ...entry,
  imageUrl: resolveApiUrl(entry.imageUrl),
  videoUrl: resolveApiUrl(entry.videoUrl),
});

/**
 * Ambil seluruh entri kamus dari backend (GET /dictionary, paginasi cursor).
 * Jika backend tidak terjangkau, pakai data mock sebagai fallback offline.
 */
export async function fetchDictionaryEntries(): Promise<DictionaryEntry[]> {
  if (cachedEntries) {
    return cachedEntries;
  }

  try {
    const items: DictionaryEntry[] = [];
    let cursor: string | null = null;

    do {
      const query: string = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : '?limit=100';
      const data: { items: DictionaryEntry[]; nextCursor: string | null } = await apiRequest(
        `/dictionary${query}`
      );
      items.push(...data.items.map(normalizeEntry));
      cursor = data.nextCursor;
    } while (cursor);

    if (items.length > 0) {
      cachedEntries = items;
      return items;
    }
  } catch {
    // Backend tidak terjangkau — pakai fallback di bawah.
  }

  return fallbackEntries;
}

export async function searchDictionary(search: string): Promise<DictionaryEntry[]> {
  try {
    const data = await apiRequest<{ items: DictionaryEntry[] }>(
      `/dictionary?search=${encodeURIComponent(search)}&limit=10`
    );
    return data.items.map(normalizeEntry);
  } catch {
    const normalized = search.trim().toLowerCase();
    return fallbackEntries.filter((entry) => entry.word.toLowerCase().includes(normalized));
  }
}

export function invalidateDictionaryCache(): void {
  cachedEntries = null;
}
