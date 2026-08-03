import { useEffect } from 'react';
import { BackHandler, Platform, StatusBar } from 'react-native';

import { lockPortrait, unlockOrientation } from '../utils/orientation';

/**
 * Menyiapkan lingkungan mode layar penuh selama `active` bernilai true:
 * orientasi dibebaskan (mengikuti perangkat), status bar disembunyikan, dan
 * tombol kembali Android dipakai untuk keluar dari layar penuh.
 */
export function useFullscreenMode(active: boolean, onExit: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }

    void unlockOrientation();
    StatusBar.setHidden(true, 'fade');

    return () => {
      StatusBar.setHidden(false, 'fade');
      void lockPortrait();
    };
  }, [active]);

  useEffect(() => {
    if (!active || Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onExit();
      return true;
    });

    return () => subscription.remove();
  }, [active, onExit]);
}

export default useFullscreenMode;
