import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, overlay, radius, spacing, touchTargetMin } from '../../theme';
import Heading from './Heading';
import PressableScale from './PressableScale';

export interface BackHeaderProps {
  title?: string;
  onBack: () => void;
  right?: React.ReactNode;
  /** 'dark' untuk dipakai di atas latar gelap (mis. kamera). */
  tone?: 'light' | 'dark';
}

/** Header sub-layar konsisten: tombol kembali bulat + judul + slot kanan. */
export default function BackHeader({ title, onBack, right, tone = 'light' }: BackHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <View style={styles.row}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={onBack}
        style={[styles.backBtn, { backgroundColor: isDark ? overlay.onInkSoft : colors.primarySurface }]}
      >
        <Ionicons color={isDark ? colors.surface : colors.primary} name="arrow-back" size={22} />
      </PressableScale>

      {title ? (
        <Heading variant="h2" color={isDark ? 'onPrimary' : 'default'} numberOfLines={1} style={styles.title}>
          {title}
        </Heading>
      ) : (
        <View style={styles.title} />
      )}

      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
