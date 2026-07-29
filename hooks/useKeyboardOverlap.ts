import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
  type KeyboardMetrics,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Tinggi konten yang benar-benar tertutup keyboard, dihitung relatif terhadap
 * area aman bawah (SafeAreaView `bottom`) supaya tidak dihitung dua kali.
 *
 * Android API 30+: React Native mengirim `endCoordinates.height` sebesar
 * `imeInsets.bottom - systemBarsInsets.bottom`, jadi nilainya dipakai apa
 * adanya. `screenY` tidak bisa dipercaya di sini karena dengan edge-to-edge
 * window tidak lagi menyusut saat keyboard naik. Jalur lawas (API < 30) belum
 * mengurangi system bar, jadi inset bawah dikurangi manual.
 *
 * iOS: frame keyboard berada di koordinat window, jadi posisi atas keyboard
 * dikurangi inset bawah memberi tumpang tindih yang tepat.
 */
export function useKeyboardOverlap(): number {
  const insets = useSafeAreaInsets();
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const computeOverlap = (metrics: KeyboardMetrics): number => {
      const raw =
        Platform.OS === 'android'
          ? Number(Platform.Version) >= 30
            ? metrics.height
            : metrics.height - insets.bottom
          : Dimensions.get('window').height - metrics.screenY - insets.bottom;

      return raw > 0 ? Math.round(raw) : 0;
    };

    const handleFrame = (event: KeyboardEvent) => setOverlap(computeOverlap(event.endCoordinates));

    // Selaraskan ulang saat efek dipasang: keyboard bisa sudah terbuka, atau
    // inset berubah (mis. ganti mode navigasi) tanpa event keyboard baru.
    const current = Keyboard.metrics();
    setOverlap(current ? computeOverlap(current) : 0);

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
  }, [insets.bottom]);

  return overlap;
}

export default useKeyboardOverlap;
