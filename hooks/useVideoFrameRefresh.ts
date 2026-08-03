import { useCallback, useEffect, useRef } from 'react';
import type { VideoPlayer } from 'expo-video';

import type { FullscreenPhase } from './useFullscreenHandoff';

/** Beri kesempatan surface baru selesai dipasang sebelum frame dipaksa gambar. */
const REFRESH_DELAY_MS = 80;

/**
 * Memaksa satu frame digambar ulang pada surface yang sedang aktif.
 *
 * Saat pemutar sedang dijeda, `VideoView` yang baru dipasang tidak menerima
 * frame baru sehingga panggung tampil hitam. Seek ke posisi yang sama membuat
 * pemutar menggambar ulang frame terakhirnya.
 */
export function useVideoFrameRefresh(player: VideoPlayer): () => void {
  return useCallback(() => {
    if (player.playing) {
      return;
    }
    try {
      player.currentTime = player.currentTime;
    } catch {
      // Pemutar belum siap menerima seek — frame akan digambar saat sumber siap.
    }
  }, [player]);
}

/**
 * Menyegarkan frame setiap kali panggung selesai berpindah wadah (inline ⇄
 * layar penuh). Pemasangan pertama sengaja dilewati: belum ada perpindahan.
 */
export function useFrameRefreshOnHandoff(phase: FullscreenPhase, refreshFrame: () => void) {
  const previousPhaseRef = useRef<FullscreenPhase>(phase);

  useEffect(() => {
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = phase;

    const settled = phase === 'open' || phase === 'closed';
    if (previous === phase || !settled) {
      return;
    }

    const timer = setTimeout(refreshFrame, REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, refreshFrame]);
}

export default useVideoFrameRefresh;
