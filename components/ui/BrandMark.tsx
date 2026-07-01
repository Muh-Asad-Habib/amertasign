import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, overlay, radius } from '../../theme';
import GradientSurface from './GradientSurface';

export interface BrandMarkProps {
  size?: number;
  /** Untuk latar gelap/teal (mis. splash): wadah putih transparan + ikon terang. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Logo AmertaSign berbasis vektor (ikon tangan) — pengganti emoji 🤟.
 * Konsisten lintas platform & mendukung tema terang/gelap.
 */
export default function BrandMark({ size = 96, onDark = false, style }: BrandMarkProps) {
  const iconSize = Math.round(size * 0.46);
  const cornerRadius = Math.round(size * 0.3);

  if (onDark) {
    return (
      <View
        style={[
          styles.dark,
          { width: size, height: size, borderRadius: cornerRadius },
          style,
        ]}
      >
        <Ionicons color={colors.surface} name="hand-left" size={iconSize} />
      </View>
    );
  }

  return (
    <GradientSurface
      colors={gradients.primary}
      radius={cornerRadius}
      shadowLevel="md"
      style={style}
      contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons color={colors.textOnPrimary} name="hand-left" size={iconSize} />
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  dark: {
    backgroundColor: overlay.onBrandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: overlay.onBrandSoft,
  },
});
