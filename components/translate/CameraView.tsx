import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontFamily, gradients, overlay, radius, spacing } from '../../theme';
import Decor from '../ui/Decor';
import Heading from '../ui/Heading';
import Text from '../ui/Text';

export interface CameraViewProps {
  isActive: boolean;
}

export default function CameraView({ isActive }: CameraViewProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.ink} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Decor preset="ink" />

      {/* Bingkai pemindai (viewfinder) */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={[styles.statusPill, isActive && styles.statusPillActive]}>
        <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
        <Text style={styles.statusText}>{isActive ? 'Kamera aktif' : 'Kamera siaga'}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.cameraGlyph, isActive && styles.cameraGlyphActive]}>
          <Ionicons color={isActive ? colors.textOnAccent : colors.textOnPrimary} name="scan" size={52} />
        </View>
        <Heading variant="h2" color="onPrimary" align="center">
          Arahkan kamera ke pengguna bahasa isyarat
        </Heading>
        <Text style={styles.subtitle}>
          {isActive ? 'Kamera siap mendeteksi gerakan tangan.' : 'Aktifkan kamera untuk memulai terjemahan.'}
        </Text>
      </View>
    </View>
  );
}

const CORNER = 30;

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xxl,
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
  },
  cornerTL: { top: spacing.base, left: spacing.base, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: spacing.base, right: spacing.base, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: spacing.base, left: spacing.base, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: spacing.base, right: spacing.base, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: overlay.onInkSoft,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusPillActive: {
    backgroundColor: 'rgba(242, 169, 0, 0.18)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.textTertiary,
  },
  statusDotActive: {
    backgroundColor: colors.accent,
  },
  statusText: {
    color: 'rgba(255, 253, 248, 0.82)',
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  cameraGlyph: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: overlay.onInkBorder,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 112,
  },
  cameraGlyphActive: {
    backgroundColor: colors.accent,
  },
  subtitle: {
    color: 'rgba(255, 253, 248, 0.7)',
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
