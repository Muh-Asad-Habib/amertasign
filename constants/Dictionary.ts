import type { DictionaryCategory } from '../types';

/** Label kategori kamus dalam Bahasa Indonesia. */
export const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  alfabet: 'Alfabet',
  angka: 'Angka',
  kata_umum: 'Kata Umum',
  frasa: 'Frasa',
};


export const HIDDEN_SIGN_WORDS: ReadonlySet<string> = new Set([
  'jalan',
  'kenapa',
  'lari',
  'malas',
  'memasak',
  'olahraga',
  'pintar',
  'rajin',
  'suka',
]);

/** True bila kata isyarat sedang disembunyikan sementara (lihat catatan di atas). */
export function isHiddenSignWord(word: string): boolean {
  return HIDDEN_SIGN_WORDS.has(word.trim().toLowerCase());
}
