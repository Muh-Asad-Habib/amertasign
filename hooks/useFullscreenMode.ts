import { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';

import type { FullscreenPhase } from './useFullscreenHandoff';
import { lockPortrait, unlockOrientation } from '../utils/orientation';

/**
 * Jeda sebelum orientasi dikunci kembali ke portrait. Penguncian memicu
 * configuration change; bila dijalankan pada frame yang sama dengan penutupan
 * modal, `VideoView` inline sedang dipasang ulang dan surface-nya bisa gagal
 * tergambar. Menunggu sebentar membuat kedua proses tidak saling bertabrakan.
 */
const RELOCK_DELAY_MS = 400;

/**
 * Menyiapkan lingkungan mode layar penuh mengikuti fase serah-terima modal:
 * orientasi dibebaskan (mengikuti perangkat) dan status bar disembunyikan
 * selama modal tampil, lalu dikembalikan setelah modal benar-benar tertutup.
 *
 * Tombol kembali Android sengaja tidak ditangani di sini — `Modal.onRequestClose`
 * sudah menanganinya, dan memasang `BackHandler` tambahan membuat satu tekanan
 * back diproses dua kali.
 */
export function useFullscreenMode(phase: FullscreenPhase) {
  const relockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relockPendingRef = useRef(false);
  const isActive = phase !== 'closed';

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (relockTimerRef.current) {
      clearTimeout(relockTimerRef.current);
      relockTimerRef.current = null;
    }
    relockPendingRef.current = false;

    void unlockOrientation();
    StatusBar.setHidden(true, 'fade');

    return () => {
      StatusBar.setHidden(false, 'fade');
      relockPendingRef.current = true;
      relockTimerRef.current = setTimeout(() => {
        relockTimerRef.current = null;
        relockPendingRef.current = false;
        void lockPortrait();
      }, RELOCK_DELAY_MS);
    };
  }, [isActive]);

  // Komponen dibongkar sebelum penundaan selesai (mis. pengguna berpindah layar
  // tepat setelah keluar dari layar penuh): penguncian dijalankan sekarang juga,
  // kalau tidak aplikasi tertinggal dalam keadaan bebas berputar.
  useEffect(
    () => () => {
      if (relockTimerRef.current) {
        clearTimeout(relockTimerRef.current);
        relockTimerRef.current = null;
      }
      if (relockPendingRef.current) {
        relockPendingRef.current = false;
        void lockPortrait();
      }
    },
    []
  );
}

export default useFullscreenMode;
