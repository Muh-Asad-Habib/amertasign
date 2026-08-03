import { useCallback, useEffect, useState } from 'react';

/**
 * Tahap serah-terima `VideoView` antara tampilan inline dan modal layar penuh.
 *
 * - `closed`   — modal tertutup, `VideoView` inline yang dipasang.
 * - `opening`  — `VideoView` inline sudah dilepas, modal tampil tapi belum
 *                memasang `VideoView` layar penuh.
 * - `open`     — `VideoView` layar penuh terpasang.
 * - `closing`  — `VideoView` layar penuh sudah dilepas, modal masih tampil.
 */
export type FullscreenPhase = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Cadangan bila `Modal.onShow` tidak pernah datang (mis. perbedaan perilaku
 * antar platform), supaya layar penuh tidak pernah macet di fase `opening`.
 */
const SHOW_FALLBACK_MS = 400;

export interface FullscreenHandoff {
  phase: FullscreenPhase;
  /** Modal harus dirender selama bukan `closed`. */
  modalVisible: boolean;
  /** `VideoView` layar penuh hanya boleh dipasang saat `open`. */
  fullscreenStageMounted: boolean;
  /** Dipasang ke `Modal.onShow`. */
  handleModalShown: () => void;
}

/** Menunggu satu siklus render penuh agar commit sebelumnya benar-benar terpasang. */
function useAfterNextFrame(enabled: boolean, task: () => void) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let inner: number | undefined;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(task);
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner !== undefined) {
        cancelAnimationFrame(inner);
      }
    };
    // `task` sengaja tidak jadi dependensi: pemanggil selalu mengirim callback
    // stabil, dan memasukkannya akan memulai ulang penantian tiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

/**
 * Menjamin **hanya satu `VideoView` yang hidup** untuk satu `VideoPlayer`, dan
 * pelepasan selalu terjadi sebelum pemasangan berikutnya.
 *
 * Alasannya ada di sisi native `expo-video`: setter `VideoView.videoPlayer`
 * memanggil `changePlayerView()` lalu `hasBeenDisconnectedFromPlayerView()`
 * pada pemutar lama. Di Android `Modal` adalah window terpisah, sehingga urutan
 * unmount (inline) dan mount (layar penuh) tidak dijamin. Bila mount terjadi
 * lebih dulu, pemutar menganggap dirinya masih tersambung ke view lain —
 * `currentPlayerView` ikut dikosongkan sehingga dua `PlayerView` memegang satu
 * `ExoPlayer` dan video berubah hitam. Itulah sebab layar penuh "kadang bisa
 * kadang tidak".
 */
export function useFullscreenHandoff(requested: boolean): FullscreenHandoff {
  const [phase, setPhase] = useState<FullscreenPhase>('closed');
  /** Modal sudah benar-benar tampil di layar (lewat `onShow`). */
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    if (requested) {
      setPhase((current) => (current === 'closed' || current === 'closing' ? 'opening' : current));
      return;
    }
    setPhase((current) => (current === 'open' || current === 'opening' ? 'closing' : current));
  }, [requested]);

  useEffect(() => {
    if (phase === 'closed') {
      setModalShown(false);
    }
  }, [phase]);

  // Modal sudah tampil tapi `onShow` belum datang — jangan menunggu selamanya.
  useEffect(() => {
    if (phase !== 'opening' || modalShown) {
      return;
    }
    const timer = setTimeout(() => setModalShown(true), SHOW_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [modalShown, phase]);

  const enterOpen = useCallback(() => {
    setPhase((current) => (current === 'opening' ? 'open' : current));
  }, []);

  const enterClosed = useCallback(() => {
    setPhase((current) => (current === 'closing' ? 'closed' : current));
  }, []);

  // Panggung layar penuh dipasang setelah modal tampil dan satu frame terlewati.
  useAfterNextFrame(phase === 'opening' && modalShown, enterOpen);
  // Modal baru ditutup setelah panggung layar penuh benar-benar dilepas.
  useAfterNextFrame(phase === 'closing', enterClosed);

  const handleModalShown = useCallback(() => setModalShown(true), []);

  return {
    phase,
    modalVisible: phase !== 'closed',
    fullscreenStageMounted: phase === 'open',
    handleModalShown,
  };
}

export default useFullscreenHandoff;
