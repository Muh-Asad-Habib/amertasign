import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { shadow } from '../../theme';
import { useSettingsStore } from '../../store/useSettingsStore';

const LOGO = require('../../assets/logo.png');

export interface BrandMarkProps {
  size?: number;
  /** Untuk latar gelap/biru (mis. splash): wadah kartu putih agar logo biru terbaca. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Logo resmi AMERTA (dua tangan + gelombang suara) dari assets.
 * Latar terang: logo transparan langsung. Latar gelap (prop onDark atau
 * mode gelap aktif): kartu putih membulat agar logo biru tetap terbaca.
 */
export default function BrandMark({ size = 96, onDark = false, style }: BrandMarkProps) {
  const isDarkTheme = useSettingsStore((state) => state.themeMode) === 'dark';
  const cornerRadius = Math.round(size * 0.28);
  const useCard = onDark || isDarkTheme;

  if (useCard) {
    const logoSize = Math.round(size * 0.82);
    return (
      <View
        style={[
          styles.card,
          { width: size, height: size, borderRadius: cornerRadius },
          style,
        ]}
      >
        <Image accessibilityLabel="Logo AmertaSign" source={LOGO} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        accessibilityLabel="Logo AmertaSign"
        source={LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Kartu selalu putih — logo biru butuh latar terang di kedua tema.
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
});
