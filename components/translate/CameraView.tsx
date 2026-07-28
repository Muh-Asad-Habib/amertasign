import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView as ExpoCamera, useCameraPermissions, type CameraType } from 'expo-camera';
import type { MediaUpload } from '../../services/translation';

import { colors, fontFamily, gradients, overlay, radius, spacing } from '../../theme';
import Decor from '../ui/Decor';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface CameraViewProps {
  /** Sedang merekam gerakan (tombol rekam aktif). */
  isRecording: boolean;
  /** Sedang mengirim & menganalisis hasil rekaman. */
  isProcessing?: boolean;
  /** Durasi rekaman berjalan (ms) untuk penunjuk waktu. */
  elapsedMs?: number;
  /** Kamera depan/belakang — dikontrol tombol flip di layar. */
  facing?: CameraType;
}

export interface CameraViewHandle {
  /** Mulai merekam; promise selesai saat perekaman dihentikan. */
  startRecording(maxDurationSec: number): Promise<MediaUpload>;
  /** Hentikan perekaman yang sedang berjalan. */
  stopRecording(): void;
}

const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(function CameraView(
  { isRecording, isProcessing = false, elapsedMs = 0, facing = 'front' },
  ref
) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasCamera = Boolean(permission?.granted);
  const cameraRef = useRef<ExpoCamera>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRecording) {
      blink.stopAnimation();
      blink.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.15,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [blink, isRecording]);

  useImperativeHandle(ref, () => ({
    async startRecording(maxDurationSec: number) {
      if (!cameraRef.current || !cameraReady) {
        throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
      }
      const result = await cameraRef.current.recordAsync({
        maxDuration: maxDurationSec,
        mirror: facing === 'front',
      });
      if (!result?.uri) {
        throw new Error('Perekaman video gagal.');
      }
      return { uri: result.uri, fileName: 'isyarat.mp4', mimeType: 'video/mp4', type: 'video' as const };
    },
    stopRecording() {
      cameraRef.current?.stopRecording();
    },
  }), [cameraReady, facing]);

  const statusText = isRecording
    ? `MEREKAM · ${formatElapsed(elapsedMs)}`
    : isProcessing
      ? 'Menganalisis...'
      : hasCamera
        ? 'Kamera siaga'
        : 'Kamera nonaktif';

  return (
    <View style={[styles.container, isRecording && styles.containerRecording]}>
      {hasCamera ? (
        <ExpoCamera
          facing={facing}
          mode="video"
          mute
          onCameraReady={() => setCameraReady(true)}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          videoQuality="720p"
        />
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

      {/* Bingkai pemindai (viewfinder) — berubah merah saat merekam. */}
      <View style={[styles.corner, styles.cornerTL, isRecording && styles.cornerRecording]} />
      <View style={[styles.corner, styles.cornerTR, isRecording && styles.cornerRecording]} />
      <View style={[styles.corner, styles.cornerBL, isRecording && styles.cornerRecording]} />
      <View style={[styles.corner, styles.cornerBR, isRecording && styles.cornerRecording]} />

      {isRecording ? <View style={styles.recordingOutline} pointerEvents="none" /> : null}

      <View
        style={[
          styles.statusPill,
          isProcessing && styles.statusPillActive,
          isRecording && styles.statusPillRecording,
        ]}
      >
        <Animated.View
          style={[
            styles.statusDot,
            isProcessing && styles.statusDotActive,
            isRecording && styles.statusDotRecording,
            isRecording && { opacity: blink },
          ]}
        />
        <Text style={[styles.statusText, isRecording && styles.statusTextRecording]}>{statusText}</Text>
      </View>

      {hasCamera ? (
        <View style={styles.hintWrap} pointerEvents="none">
          <View style={[styles.hintPill, isRecording && styles.hintPillRecording]}>
            <Ionicons
              color={colors.textOnPrimary}
              name={isRecording ? 'stop-circle-outline' : 'hand-left-outline'}
              size={16}
            />
            <Text style={styles.hintText}>
              {isRecording
                ? 'Peragakan isyarat — ketuk tombol merah untuk berhenti'
                : 'Posisikan tangan di dalam bingkai'}
            </Text>
          </View>
        </View>
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
});

export default CameraView;

const CORNER = 30;

const styles = createSheet((colors) => ({
  container: {
    borderRadius: radius.xxl,
    flex: 1,
    // Tanpa minHeight tetap: biarkan preview menyusut mengikuti ruang tersisa
    // agar bagian bawah tidak terpotong bottom sheet pada layar pendek.
    minHeight: 0,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  containerRecording: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  recordingOutline: {
    ...StyleSheet.absoluteFillObject,
    borderColor: colors.error,
    borderRadius: radius.xxl,
    borderWidth: 4,
    zIndex: 1,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
    zIndex: 2,
  },
  cornerRecording: {
    borderColor: colors.error,
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
  statusPillRecording: {
    backgroundColor: colors.error,
    borderColor: colors.error,
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
  statusDotRecording: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
  },
  statusText: {
    color: 'rgba(255, 253, 248, 0.9)',
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
  },
  statusTextRecording: {
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  hintWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    zIndex: 2,
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
  hintPillRecording: {
    backgroundColor: 'rgba(197, 34, 31, 0.85)',
  },
  hintText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
    flexShrink: 1,
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
