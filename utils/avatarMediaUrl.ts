import type { AvatarGender } from '../store/useSettingsStore';

/**
 * Sesuaikan URL media kamus (gambar/video) dengan karakter peraga terpilih.
 *
 * `GET /dictionary` hanya mengembalikan URL media peraga default (laki-laki),
 * padahal server juga menyajikan media perempuan pada path yang sama persis
 * dengan tambahan segmen `female/` (mis. `/api/v1/media/bisindo/female/kata/
 * makan.jpg`). Fungsi ini cukup menyisipkan segmen tersebut — tanpa request
 * tambahan ke server. Bila media perempuan untuk berkas tertentu belum ada,
 * pemakai wajib menyediakan fallback (lihat prop `fallbackImageUrl` WordCard).
 */
export function avatarMediaUrl(url: string, gender: AvatarGender): string {
  if (!url || gender !== 'female' || url.includes('/media/bisindo/female/')) {
    return url;
  }
  if (!url.includes('/media/bisindo/')) {
    // URL non-kamus (mis. media SIBI atau aset lokal) dibiarkan apa adanya.
    return url;
  }
  return url.replace('/media/bisindo/', '/media/bisindo/female/');
}
