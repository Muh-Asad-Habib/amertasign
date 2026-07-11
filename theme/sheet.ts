import { StyleSheet } from 'react-native';

import { getActiveColorScheme, themes, type AppColors, type ThemeScheme } from './colors';

/**
 * StyleSheet sadar-tema: factory menerima token warna tema aktif dan hasilnya
 * di-cache per skema. Properti dibaca lewat Proxy saat render, jadi style
 * otomatis mengikuti mode gelap/terang tanpa mengubah pola pemakaian
 * (`styles.foo` tetap sama seperti StyleSheet.create biasa).
 */
export function createSheet<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: AppColors) => T
): T {
  const cache: Partial<Record<ThemeScheme, T>> = {};

  return new Proxy({} as T, {
    get(_target, prop) {
      const scheme = getActiveColorScheme();
      let sheet = cache[scheme];
      if (!sheet) {
        sheet = StyleSheet.create(factory(themes[scheme]));
        cache[scheme] = sheet;
      }
      return sheet[prop as keyof T];
    },
    ownKeys() {
      const scheme = getActiveColorScheme();
      let sheet = cache[scheme];
      if (!sheet) {
        sheet = StyleSheet.create(factory(themes[scheme]));
        cache[scheme] = sheet;
      }
      return Reflect.ownKeys(sheet);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const scheme = getActiveColorScheme();
      let sheet = cache[scheme];
      if (!sheet) {
        sheet = StyleSheet.create(factory(themes[scheme]));
        cache[scheme] = sheet;
      }
      return {
        enumerable: true,
        configurable: true,
        value: sheet[prop as keyof T],
      };
    },
  });
}
