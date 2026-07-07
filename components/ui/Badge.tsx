import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius } from '../../theme';

import { createSheet } from '../../theme';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'neutral';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

/** Dibaca saat render agar mengikuti tema aktif (gelap/terang). */
const variantStyleFor = (variant: BadgeVariant): { backgroundColor: string; color: string } =>
  ({
    primary: { backgroundColor: colors.primarySurface, color: colors.primaryStrong },
    accent: { backgroundColor: colors.accentSurface, color: colors.accentStrong },
    success: { backgroundColor: colors.successTint, color: colors.success },
    warning: { backgroundColor: colors.warningTint, color: colors.accentStrong },
    neutral: { backgroundColor: colors.surfaceMuted, color: colors.textSecondary },
  })[variant];

const sizeStyles: Record<BadgeSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
  sm: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
  md: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
};

export default function Badge({ text, variant = 'neutral', size = 'md' }: BadgeProps) {
  const v = variantStyleFor(variant);
  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: v.backgroundColor, paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical },
      ]}
    >
      <Text style={[styles.text, { color: v.color, fontSize: s.fontSize }]}>{text}</Text>
    </View>
  );
}

const styles = createSheet((colors) => ({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
  },
  text: {
    fontFamily: fontFamily.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
}));
