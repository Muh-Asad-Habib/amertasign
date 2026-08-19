import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView as ExpoCamera, useCameraPermissions, type CameraType } from 'expo-camera';
import type { MediaUpload } from '../../services/translation';

import { colors, fontFamily, gradients, overlay, palette, radius, spacing, touchTargetMin } from '../../theme';
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
  /** Nyalakan senter (hanya efektif pada kamera belakang). */
  torchEnabled?: boolean;
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
  { isRecording, isProcessing = false, elapsedMs = 0, facing = 'front', torchEnabled = false },
  ref
) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasCamera = Boolean(permission?.granted);
  // Setelah izin ditolak permanen, dialog sistem tak akan muncul lagi —
  // arahkan pengguna ke Pengaturan agar tidak menemui tombol yang "diam".
  const canRequestPermission = permission?.canAskAgain !== false;
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
        ? 'Siap merekam'
        : 'Kamera nonaktif';

  // Label pembaca layar sengaja tanpa timer agar TalkBack hanya mengumumkan
  // perubahan status, bukan setiap detik perekaman.
  const statusAnnouncement = isRecording
    ? 'Sedang merekam isyarat'
    : isProcessing
      ? 'Sedang menganalisis isyarat, mohon tunggu'
      : hasCamera
        ? 'Kamera siap merekam'
        : 'Kamera nonaktif';

  return (
    <View style={styles.container}>
      {hasCamera ? (
        <ExpoCamera
          enableTorch={torchEnabled && facing === 'back'}
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

      <View
        accessible
        accessibilityLabel={statusAnnouncement}
        accessibilityLiveRegion="polite"
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
          <View style={styles.hintPill}>
            <Ionicons
              color={colors.textOnPrimary}
              name={isRecording ? 'stop-circle-outline' : 'hand-left-outline'}
              size={16}
            />
            <Text style={styles.hintText}>
              {isRecording
                ? 'Tahan tiap isyarat ±2 detik — ketuk tombol merah untuk berhenti'
                : 'Jarak ±1 m, cahaya merata, kedua tangan tetap di bingkai'}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
        >
          <View style={styles.cameraGlyph}>
            <Ionicons color={colors.textOnPrimary} name="videocam-off-outline" size={34} />
          </View>
          <Heading variant="h2" color="onPrimary" align="center">
            Izinkan akses kamera
          </Heading>
          <Text style={styles.subtitle}>
            {canRequestPermission
              ? 'Amerta Sign butuh kamera untuk mendeteksi isyarat BISINDO.'
              : 'Izin kamera diblokir. Aktifkan izin Kamera lewat Pengaturan perangkat.'}
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={canRequestPermission ? 'Izinkan kamera' : 'Buka pengaturan aplikasi'}
            onPress={() => {
              if (canRequestPermission) {
                void requestPermission();
                return;
              }
              void Linking.openSettings();
            }}
            style={styles.permissionBtn}
          >
            <Text variant="bodyStrong" style={styles.permissionText}>
              {canRequestPermission ? 'Izinkan Kamera' : 'Buka Pengaturan'}
            </Text>
          </PressableScale>
        </ScrollView>
      )}

      {/* Overlay proses AI: memberi umpan balik jelas bahwa analisis berjalan. */}
      {isProcessing ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.processingOverlay}
          pointerEvents="none"
        >
          <View style={styles.processingCard}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.processingText}>Menganalisis isyarat...</Text>
            <Text style={styles.processingHint}>Mohon tunggu sebentar</Text>
          </View>
        </View>
      ) : null}
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
    backgroundColor: overlay.inkScrim,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 2,
  },
  statusPillActive: {
    backgroundColor: overlay.accentTint,
  },
  statusPillRecording: {
    // Tint tipis saja, bukan blok merah pekat, agar tidak mendominasi tampilan.
    backgroundColor: overlay.errorTint,
    borderColor: overlay.errorBorder,
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
    backgroundColor: palette.errorBright,
    width: 10,
    height: 10,
  },
  statusText: {
    color: overlay.onInkText,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
  },
  statusTextRecording: {
    color: palette.white,
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
    backgroundColor: overlay.inkScrim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  hintText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
    flexShrink: 1,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    // Isi kartu izin sengaja dijaga cukup ringkas agar muat tanpa digulir pada
    // ruang tersisa antara top bar dan bottom sheet (±252 dp di layar 832 dp).
    // `flexGrow` + `justifyContent` memusatkannya saat ruang cukup, dan gulir
    // hanya jadi jaring pengaman untuk font sistem yang sangat besar.
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  cameraGlyph: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: overlay.onInkBorder,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 60,
  },
  subtitle: {
    color: overlay.onInkTextSoft,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  permissionBtn: {
    minHeight: touchTargetMin,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  permissionText: {
    color: colors.textOnAccent,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlay.inkScrim,
    zIndex: 3,
  },
  processingCard: {
    alignItems: 'center',
    backgroundColor: overlay.inkScrimStrong,
    borderColor: overlay.onInkBorder,
    borderRadius: radius.xxl,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  processingText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  processingHint: {
    color: overlay.onInkTextSoft,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
  },
}));
