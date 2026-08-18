import type { DictionaryCategory } from '../types';

/** Label kategori kamus dalam Bahasa Indonesia. */
export const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  alfabet: 'Alfabet',
  angka: 'Angka',
  kata_umum: 'Kata Umum',
  frasa: 'Frasa',
};

// ============================================================================
// CATATAN SEMENTARA — HAPUS BLOK INI KETIKA MEDIA SUDAH LENGKAP
// ============================================================================
// Kata-kata di bawah disembunyikan dari kamus (daftar, pencarian, kata terkait)
// DAN dari hasil terjemahan teks/suara → gerakan, karena di server baru tersedia
// video peraga laki-laki — video peraga perempuannya belum direkam.
//
// HAPUS Set ini BESERTA seluruh pemakainya (cari "HIDDEN_SIGN_WORDS" di
// services/dictionary.ts dan services/translation.ts) ketika kata-kata ini
// sudah ditambahkan di kamus server dengan peraga laki-laki DAN perempuan.
//
// Cara cek per kata (tanpa build):
//   POST https://amertasign.lab-if.tech/api/v1/translate/text-to-sign
//   body {"text":"<kata>","signLanguageType":"bisindo","avatar":"female"}
//   → bila "avatarFallback": false, media perempuan sudah ada → keluarkan kata
//   itu dari daftar (atau hapus blok ini bila semua sudah lengkap; bisa juga
//   cek GET /translate/avatars → coverage female = 1.0).
// ============================================================================
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
