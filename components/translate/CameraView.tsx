import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView as ExpoCamera, useCameraPermissions, type CameraType } from 'expo-camera';

import { colors, fontFamily, gradients, overlay, radius, spacing } from '../../theme';
import Decor from '../ui/Decor';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface CameraViewProps {
  isActive: boolean;
  /** Kamera depan/belakang — dikontrol tombol flip di layar. */
  facing?: CameraType;
}

export default function CameraView({ isActive, facing = 'front' }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasCamera = Boolean(permission?.granted);

  return (
    <View style={styles.container}>
      {hasCamera ? (
        <ExpoCamera facing={facing} style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <LinearGradient
            colors={gradients.ink}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Decor preset="ink" />
        </>
      )}

      {/* Bingkai pemindai (viewfinder) */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={[styles.statusPill, isActive && styles.statusPillActive]}>
        <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
        <Text style={styles.statusText}>{isActive ? 'Mendeteksi' : hasCamera ? 'Kamera siaga' : 'Kamera nonaktif'}</Text>
      </View>

      {hasCamera ? (
        !isActive ? (
          <View style={styles.hintWrap} pointerEvents="none">
            <View style={styles.hintPill}>
              <Ionicons color={colors.textOnPrimary} name="hand-left-outline" size={16} />
              <Text style={styles.hintText}>Posisikan tangan di dalam bingkai</Text>
            </View>
          </View>
        ) : null
      ) : (
        <View style={styles.content}>
          <View style={styles.cameraGlyph}>
            <Ionicons color={colors.textOnPrimary} name="videocam-off-outline" size={44} />
          </View>
          <Heading variant="h2" color="onPrimary" align="center">
            Izinkan akses kamera
          </Heading>
          <Text style={styles.subtitle}>
            Amerta Sign butuh kamera untuk mendeteksi gerakan isyarat BISINDO.
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Izinkan kamera"
            onPress={() => {
              void requestPermission();
            }}
            style={styles.permissionBtn}
          >
            <Text variant="bodyStrong" style={styles.permissionText}>
              Izinkan Kamera
            </Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const CORNER = 30;

const styles = createSheet((colors) => ({
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
    zIndex: 2,
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
    backgroundColor: 'rgba(10, 14, 22, 0.55)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 2,
  },
  statusPillActive: {
    backgroundColor: 'rgba(251, 182, 4, 0.28)',
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
    color: 'rgba(255, 253, 248, 0.9)',
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
  },
  hintWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(10, 14, 22, 0.6)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  hintText: {
    color: colors.textOnPrimary,
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
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 96,
  },
  subtitle: {
    color: 'rgba(255, 253, 248, 0.7)',
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  permissionBtn: {
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  permissionText: {
    color: colors.textOnAccent,
  },
}));
