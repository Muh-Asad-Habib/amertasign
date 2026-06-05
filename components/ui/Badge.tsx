import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  primary: '#DBEAFE',
  primaryText: '#2563EB',
  accent: '#FEF3C7',
  accentText: '#92400E',
  success: '#DCFCE7',
  successText: '#166534',
  neutral: '#E2E8F0',
  neutralText: '#334155',
};

type BadgeVariant = 'primary' | 'accent' | 'success' | 'neutral';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles = {
  primary: { backgroundColor: COLORS.primary, color: COLORS.primaryText },
  accent: { backgroundColor: COLORS.accent, color: COLORS.accentText },
  success: { backgroundColor: COLORS.success, color: COLORS.successText },
  neutral: { backgroundColor: COLORS.neutral, color: COLORS.neutralText },
};

const sizeStyles = {
  sm: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
  md: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
};

export default function Badge({ text, variant = 'neutral', size = 'md' }: BadgeProps) {
  const selectedVariant = variantStyles[variant];
  const selectedSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: selectedVariant.backgroundColor,
          paddingHorizontal: selectedSize.paddingHorizontal,
          paddingVertical: selectedSize.paddingVertical,
        },
      ]}
    >
      <Text style={[styles.text, { color: selectedVariant.color, fontSize: selectedSize.fontSize }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  text: {
    fontWeight: '700',
  },
});
