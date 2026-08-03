import { useMemo } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';

/** Video peraga direkam mendatar 16:9; dipakai bila rasio asli belum diketahui. */
export const DEFAULT_VIDEO_ASPECT = 16 / 9;

/**
 * Pembesaran video saat layar penuh dalam posisi tegak. Layar ponsel modern
 * jauh lebih jangkung (9:19,5) daripada video peraga (16:9), sehingga video
 * yang dipasang utuh hanya mengisi sekitar seperempat layar dan sisanya hitam.
 *
 * Nilai 1,15 sengaja kecil: memotong sekitar 13% lebar video — cukup untuk
 * memangkas bidang hitam, tapi masih menyisakan seluruh tubuh dan tangan
 * peraga. Pembesaran penuh (`cover` seluruh layar) akan memotong ~75% lebar
 * dan membuat gerakan tangan hilang dari layar.
 */
const PORTRAIT_ZOOM = 1.15;

export interface FullscreenVideoBand {
  /** Jarak dari tepi atas layar ke pita video (px). */
  top: number;
  /** Tinggi pita video (px). */
  height: number;
}

export interface FullscreenVideoLayout {
  isPortrait: boolean;
  /** Mode pemasangan untuk `VideoView`. */
  contentFit: 'contain' | 'cover';
  /** Gaya kotak pembungkus `VideoView`. */
  bandStyle: ViewStyle;
  /** Posisi pita video di layar — dipakai menata kontrol agar tidak menutupinya. */
  band: FullscreenVideoBand;
}

/**
 * Tata letak panggung video layar penuh yang mengikuti orientasi perangkat.
 *
 * - Mendatar: video dipasang utuh memenuhi layar (`contain`).
 * - Tegak: video dibesarkan sedikit lalu dipotong ringan (`cover` di dalam
 *   kotak setinggi 1,15x tinggi alaminya) supaya bidang hitam tidak mendominasi.
 */
export function useFullscreenVideoLayout(
  videoAspect: number = DEFAULT_VIDEO_ASPECT
): FullscreenVideoLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const aspect = Number.isFinite(videoAspect) && videoAspect > 0 ? videoAspect : DEFAULT_VIDEO_ASPECT;
    const isPortrait = height >= width;

    if (!isPortrait) {
      return {
        isPortrait,
        contentFit: 'contain' as const,
        bandStyle: { height, width },
        band: { top: 0, height },
      };
    }

    const naturalHeight = width / aspect;
    const bandHeight = Math.min(height, naturalHeight * PORTRAIT_ZOOM);

    return {
      isPortrait,
      contentFit: 'cover' as const,
      bandStyle: { height: bandHeight, overflow: 'hidden' as const, width },
      band: { top: (height - bandHeight) / 2, height: bandHeight },
    };
  }, [height, videoAspect, width]);
}

export default useFullscreenVideoLayout;
