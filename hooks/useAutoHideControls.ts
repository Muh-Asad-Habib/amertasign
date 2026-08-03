import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const HIDE_DELAY_MS = 3000;

export interface AutoHideControlsOptions {
  /** Kontrol tidak pernah disembunyikan selama bernilai false (mis. saat dijeda). */
  autoHide: boolean;
  /** Jeda sebelum kontrol menghilang sendiri. */
  delayMs?: number;
  /** Kontrol terlihat saat pertama kali dipasang. */
  initiallyVisible?: boolean;
}

export interface AutoHideControls {
  visible: boolean;
  /** Munculkan kontrol dan mulai ulang hitungan sembunyi. */
  show: () => void;
  /** Sembunyikan kontrol sekarang juga. */
  hide: () => void;
  /** Tap panggung: sembunyikan bila sedang tampil, munculkan bila tidak. */
  toggle: () => void;
}

/**
 * Kontrol pemutar bergaya "bersih": tampil saat disentuh lalu menghilang
 * sendiri supaya video tidak tertutup. Saat pemutaran dijeda kontrol dibiarkan
 * tetap tampil agar pengguna tahu cara melanjutkannya.
 */
export function useAutoHideControls({
  autoHide,
  delayMs = HIDE_DELAY_MS,
  initiallyVisible = true,
}: AutoHideControlsOptions): AutoHideControls {
  const [visible, setVisible] = useState(initiallyVisible);
  /** Naik tiap kali kontrol "disegarkan" agar timer sembunyi dimulai ulang. */
  const [nonce, setNonce] = useState(0);
  /** Pembaca layar aktif → kontrol tidak boleh hilang sendiri (fokus lompat). */
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((enabled) => {
        if (!cancelled) {
          setScreenReaderEnabled(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    setVisible(true);
    setNonce((value) => value + 1);
  }, [clearTimer]);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const toggle = useCallback(() => {
    setVisible((current) => !current);
    setNonce((value) => value + 1);
  }, []);

  // Timer dipasang ulang setiap kali kontrol muncul atau status auto-hide
  // berubah (mis. pengguna menekan jeda → kontrol menetap).
  useEffect(() => {
    clearTimer();
    if (!visible || !autoHide || screenReaderEnabled) {
      return;
    }
    timerRef.current = setTimeout(() => setVisible(false), delayMs);
    return clearTimer;
  }, [autoHide, clearTimer, delayMs, nonce, screenReaderEnabled, visible]);

  useEffect(() => clearTimer, [clearTimer]);

  return { visible, show, hide, toggle };
}

export default useAutoHideControls;
