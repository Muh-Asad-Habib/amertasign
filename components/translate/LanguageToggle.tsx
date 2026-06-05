import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

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
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              compact ? styles.optionCompact : styles.optionRegular,
              isActive
                ? isDark
                  ? styles.optionDarkActive
                  : styles.optionLightActive
                : isDark
                  ? styles.optionDarkInactive
                  : styles.optionLightInactive,
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
    borderRadius: Layout.radius.full,
    flexDirection: 'row',
    padding: 4,
  },
  containerLight: {
    backgroundColor: '#E2E8F0',
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  option: {
    alignItems: 'center',
    borderRadius: Layout.radius.full,
    justifyContent: 'center',
    minWidth: 94,
    paddingHorizontal: Layout.spacing.md,
  },
  optionRegular: {
    minHeight: Layout.touchTargetMin,
  },
  optionCompact: {
    minHeight: 40,
    minWidth: 82,
  },
  optionLightActive: {
    backgroundColor: Colors.light.surface,
  },
  optionLightInactive: {
    backgroundColor: 'transparent',
  },
  optionDarkActive: {
    backgroundColor: Colors.light.accent,
  },
  optionDarkInactive: {
    backgroundColor: 'transparent',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelRegular: {
    fontSize: Layout.fontSize.sm,
  },
  labelCompact: {
    fontSize: 13,
  },
  labelLightActive: {
    color: Colors.light.primary,
  },
  labelLightInactive: {
    color: Colors.light.textSecondary,
  },
  labelDarkActive: {
    color: Colors.light.text,
  },
  labelDarkInactive: {
    color: 'rgba(255,255,255,0.72)',
  },
  pressed: {
    opacity: 0.88,
  },
});
