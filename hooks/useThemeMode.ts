import { useSettingsStore } from '../store/useSettingsStore';
import type { ThemeScheme } from '../theme/colors';

/**
 * Subscribe skema tema aktif. Panggil di setiap komponen layar (route) agar
 * seluruh elemen yang dibuatnya ikut re-render saat mode gelap/terang berubah —
 * subscribe di wrapper saja tidak cukup karena React bail-out pada children
 * yang referensinya sama.
 */
export function useThemeMode(): ThemeScheme {
  return useSettingsStore((state) => state.themeMode);
}
