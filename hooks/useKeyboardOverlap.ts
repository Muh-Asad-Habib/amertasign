import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  type KeyboardEvent,
  type KeyboardMetrics,
} from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Berapa piksel bagian bawah *window* yang benar-benar ditutupi keyboard.
 *
 * Android API 30+: React Native mengirim `endCoordinates.height` sebesar
 * `imeInsets.bottom - systemBarsInsets.bottom`, jadi tinggi system bar perlu
 * ditambahkan kembali untuk mendapat tumpang tindih terhadap window penuh.
 * `screenY` tidak bisa dipercaya di sini karena dengan edge-to-edge window
 * tidak lagi menyusut saat keyboard naik.
 *
 * Android API < 30: `height` sudah relatif terhadap window.
 *
 * iOS: frame keyboard berada di koordinat window, jadi tumpang tindih dihitung
 * dari selisih tepi bawah window dengan posisi atas keyboard.
 */
function computeWindowOverlap(
  metrics: KeyboardMetrics,
  bottomInset: number,
  windowBottom: number
): number {
  let raw: number;

  if (Platform.OS === 'android') {
    raw = Number(Platform.Version) >= 30 ? metrics.height + bottomInset : metrics.height;
  } else {
    raw = windowBottom - metrics.screenY;
  }

  return raw > 0 ? Math.round(raw) : 0;
}

/**
 * Tinggi keyboard relatif terhadap tepi bawah window.
 *
 * Dipakai saat konten memang membentang sampai tepi bawah window (mis. layar
 * dengan `SafeAreaView edges={['top']}`), dan untuk perhitungan gulir yang
 * memakai koordinat window (`measureInWindow`).
 */
export function useKeyboardWindowOverlap(): number {
  const insets = useSafeAreaInsets();
  // Frame SafeAreaProvider berada di koordinat window yang sama dengan hasil
  // `measureInWindow`, jadi lebih tepercaya daripada `Dimensions`.
  const frame = useSafeAreaFrame();
  const windowBottom = frame.y + frame.height;
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const handleFrame = (event: KeyboardEvent) =>
      setOverlap(computeWindowOverlap(event.endCoordinates, insets.bottom, windowBottom));

    // Selaraskan ulang saat efek dipasang: keyboard bisa sudah terbuka saat
    // komponen ter-mount, atau inset berubah (mis. ganti mode navigasi) tanpa
    // event keyboard baru.
    const current = Keyboard.metrics();
    setOverlap(current ? computeWindowOverlap(current, insets.bottom, windowBottom) : 0);

    const subscriptions =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillChangeFrame', handleFrame),
            Keyboard.addListener('keyboardWillHide', () => setOverlap(0)),
          ]
        : [
            Keyboard.addListener('keyboardDidShow', handleFrame),
            Keyboard.addListener('keyboardDidHide', () => setOverlap(0)),
          ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [insets.bottom, windowBottom]);

  return overlap;
}

/**
 * Tinggi konten yang benar-benar tertutup keyboard, dihitung relatif terhadap
 * area aman bawah (`SafeAreaView` dengan edge `bottom`) supaya tidak dihitung
 * dua kali.
 *
 * Pakai ini untuk konten yang sudah berada di dalam area aman bawah. Untuk
 * konten yang membentang sampai tepi window, pakai `useKeyboardWindowOverlap`.
 */
export function useKeyboardOverlap(): number {
  const insets = useSafeAreaInsets();
  const windowOverlap = useKeyboardWindowOverlap();

  return useMemo(() => {
    if (windowOverlap <= 0) {
      return 0;
    }
    const adjusted = windowOverlap - insets.bottom;
    return adjusted > 0 ? Math.round(adjusted) : 0;
  }, [insets.bottom, windowOverlap]);
}

/** True selama keyboard terbuka. Berguna untuk menyembunyikan UI mengambang. */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible((Keyboard.metrics()?.height ?? 0) > 0);

    const subscriptions =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillShow', () => setVisible(true)),
            Keyboard.addListener('keyboardWillHide', () => setVisible(false)),
          ]
        : [
            Keyboard.addListener('keyboardDidShow', () => setVisible(true)),
            Keyboard.addListener('keyboardDidHide', () => setVisible(false)),
          ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  return visible;
}

export default useKeyboardOverlap;
