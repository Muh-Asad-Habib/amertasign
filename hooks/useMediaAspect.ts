import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import type { VideoPlayer, VideoTrack } from 'expo-video';

/** Dipakai selama rasio asli media belum diketahui. */
export const DEFAULT_MEDIA_ASPECT = 16 / 9;

// Media peraga selalu berupa rekaman orang; nilai di luar rentang ini pasti
// hasil pembacaan yang salah, bukan rasio sungguhan.
const MIN_ASPECT = 0.2;
const MAX_ASPECT = 5;

function toAspect(width?: number | null, height?: number | null): number | null {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }
  const value = width / height;
  return Number.isFinite(value) && value >= MIN_ASPECT && value <= MAX_ASPECT ? value : null;
}

function trackAspect(track?: VideoTrack | null): number | null {
  return toAspect(track?.size?.width, track?.size?.height);
}

export interface MediaAspectOptions {
  /** Pemutar yang sedang memegang video aktif. */
  player: VideoPlayer | null;
  /** URL video aktif; null bila unit sekarang berupa gambar. */
  videoUri: string | null;
  /** URL gambar aktif; hanya dipakai saat tidak ada video. */
  imageUri?: string | null;
}

/**
 * Rasio lebar/tinggi media peraga yang sedang tampil.
 *
 * Ini bukan detail kosmetik: koleksi peraga memakai dua rasio berbeda —
 * video kata direkam 960x720 (4:3) sedangkan gambar alfabet 1920x1080 (16:9).
 * Menganggap semuanya 16:9 membuat video kata dipasang di dalam pita yang
 * terlalu pendek, sehingga muncul bidang hitam di kiri-kanan video *dan* di
 * atas-bawah pita sekaligus.
 *
 * Sumber nilai: `availableVideoTracks` dari event `sourceLoad`, dengan
 * `player.videoTrack` sebagai cadangan saat status berubah menjadi
 * `readyToPlay` (payload event bisa datang sebelum trek terpilih). Untuk unit
 * gambar dipakai `Image.getSize`.
 *
 * Saat gerakan berganti, rasio lama SENGAJA dipertahankan sampai rasio media
 * baru diketahui — bukan dikembalikan ke nilai bawaan. Mengembalikannya membuat
 * pita video (dan tombol kontrol layar penuh yang ditata mengikuti pita itu)
 * melompat ~40 dp selama beberapa ratus milidetik tiap ganti gerakan, sehingga
 * ketukan pengguna meleset dan tombol terasa "kadang tidak berfungsi".
 */
export function useMediaAspect({ player, videoUri, imageUri }: MediaAspectOptions): number {
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (!player || !videoUri) {
      return;
    }
    let cancelled = false;

    const apply = (value: number | null) => {
      if (!cancelled && value !== null) {
        setAspect(value);
      }
    };

    const readFromPlayer = () => apply(trackAspect(player.videoTrack));

    const sourceSubscription = player.addListener('sourceLoad', ({ availableVideoTracks }) => {
      const fromEvent = (availableVideoTracks ?? []).reduce<number | null>(
        (found, track) => found ?? trackAspect(track),
        null
      );
      apply(fromEvent);
      if (fromEvent === null) {
        readFromPlayer();
      }
    });

    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        readFromPlayer();
      }
    });

    // Hook bisa dipasang setelah `sourceLoad` terlanjur lewat; baca sekali,
    // tapi hanya bila pemutar memang sudah memegang sumber yang siap.
    if (player.status === 'readyToPlay') {
      readFromPlayer();
    }

    return () => {
      cancelled = true;
      sourceSubscription.remove();
      statusSubscription.remove();
    };
  }, [player, videoUri]);

  useEffect(() => {
    if (videoUri || !imageUri) {
      return;
    }
    let cancelled = false;
    Image.getSize(
      imageUri,
      (width, height) => {
        const value = toAspect(width, height);
        if (!cancelled && value !== null) {
          setAspect(value);
        }
      },
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [imageUri, videoUri]);

  return aspect ?? DEFAULT_MEDIA_ASPECT;
}

export default useMediaAspect;
