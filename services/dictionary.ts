import { dictionaryEntries as fallbackEntries } from '../constants/MockData';
import { isHiddenSignWord } from '../constants/Dictionary';
import type { DictionaryEntry } from '../types';
import { apiRequest, resolveApiUrl } from './api';

let cachedEntries: DictionaryEntry[] | null = null;
let cachedAt = 0;

/** Umur cache kamus; setelah lewat, data diambil ulang dari backend. */
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Buang entri yang sedang disembunyikan sementara.
 * Lihat CATATAN SEMENTARA di constants/Dictionary.ts — hapus filter ini
 * bersama HIDDEN_SIGN_WORDS ketika media peraga kedua gender sudah lengkap.
 */
const withoutHiddenWords = (entries: DictionaryEntry[]): DictionaryEntry[] =>
  entries.filter((entry) => !isHiddenSignWord(entry.word));

export interface DictionaryFetchResult {
  entries: DictionaryEntry[];
  /** True bila data berasal dari fallback lokal karena backend tak terjangkau. */
  isFallback: boolean;
}

const normalizeEntry = (entry: DictionaryEntry): DictionaryEntry => ({
  ...entry,
  imageUrl: resolveApiUrl(entry.imageUrl),
  videoUrl: resolveApiUrl(entry.videoUrl),
});

/**
 * Ambil seluruh entri kamus dari backend (GET /dictionary, paginasi cursor).
 * Jika backend tidak terjangkau, pakai data mock sebagai fallback offline.
 */
export async function fetchDictionaryEntries(): Promise<DictionaryFetchResult> {
  if (cachedEntries && Date.now() - cachedAt < CACHE_TTL_MS) {
    return { entries: cachedEntries, isFallback: false };
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

    const visibleItems = withoutHiddenWords(items);
    if (visibleItems.length > 0) {
      cachedEntries = visibleItems;
      cachedAt = Date.now();
      return { entries: visibleItems, isFallback: false };
    }
  } catch {
    // Backend tidak terjangkau — pakai fallback di bawah.
  }

  // Cache lama masih lebih baik daripada data contoh saat jaringan terputus.
  if (cachedEntries) {
    return { entries: cachedEntries, isFallback: true };
  }

  return { entries: withoutHiddenWords(fallbackEntries), isFallback: true };
}

export async function searchDictionary(search: string): Promise<DictionaryEntry[]> {
  try {
    const data = await apiRequest<{ items: DictionaryEntry[] }>(
      `/dictionary?search=${encodeURIComponent(search)}&limit=10`
    );
    return withoutHiddenWords(data.items.map(normalizeEntry));
  } catch {
    const normalized = search.trim().toLowerCase();
    return withoutHiddenWords(fallbackEntries).filter((entry) =>
      entry.word.toLowerCase().includes(normalized)
    );
  }
}

export function invalidateDictionaryCache(): void {
  cachedEntries = null;
  cachedAt = 0;
}
