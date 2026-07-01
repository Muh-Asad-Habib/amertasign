import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, overlay, radius, spacing } from '../../theme';

export type SignLanguageType = 'bisindo' | 'sibi';

interface LanguageToggleProps {
  value: SignLanguageType;
  onChange: (nextValue: SignLanguageType) => void;
  compact?: boolean;
  theme?: 'light' | 'dark';
}

const OPTIONS: Array<{ label: string; value: SignLanguageType }> = [
  { label: 'BISINDO', value: 'bisindo' },
  { label: 'SIBI', value: 'sibi' },
];

export default function LanguageToggle({
  value,
  onChange,
  compact = false,
  theme = 'light',
}: LanguageToggleProps) {
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              compact ? styles.optionCompact : styles.optionRegular,
              isActive
                ? isDark
                  ? styles.optionDarkActive
                  : styles.optionLightActive
                : styles.optionInactive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                compact ? styles.labelCompact : styles.labelRegular,
                isActive
                  ? isDark
                    ? styles.labelDarkActive
                    : styles.labelLightActive
                  : isDark
                    ? styles.labelDarkInactive
                    : styles.labelLightInactive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    flexDirection: 'row',
    padding: 5,
  },
  containerLight: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerDark: {
    backgroundColor: overlay.onInkSoft,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
    minWidth: 96,
    paddingHorizontal: spacing.base,
  },
  optionRegular: {
    minHeight: 44,
  },
  optionCompact: {
    minHeight: 38,
    minWidth: 82,
  },
  optionLightActive: {
    backgroundColor: colors.surface,
    shadowColor: '#3B2A18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  optionDarkActive: {
    backgroundColor: colors.accent,
  },
  optionInactive: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.6,
  },
  labelRegular: {
    fontSize: 14,
  },
  labelCompact: {
    fontSize: 13,
  },
  labelLightActive: {
    color: colors.primary,
  },
  labelLightInactive: {
    color: colors.textSecondary,
  },
  labelDarkActive: {
    color: colors.textOnAccent,
  },
  labelDarkInactive: {
    color: 'rgba(255, 253, 248, 0.72)',
  },
  pressed: {
    opacity: 0.85,
  },
});
