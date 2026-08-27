import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CameraView as ExpoCamera, useCameraPermissions } from 'expo-camera';

import BackHeader from '../components/ui/BackHeader';
import PressableScale from '../components/ui/PressableScale';
import Text from '../components/ui/Text';
import Heading from '../components/ui/Heading';
import { colors, overlay, palette, radius, spacing, touchTargetMin } from '../theme';
import { createSheet } from '../theme';
import { calibrateOrientation } from '../services/translation';
import { useOrientationStore } from '../store/useOrientationStore';
import { toUserMessage } from '../utils/errors';

/** Durasi rekaman kalibrasi — cukup untuk beberapa puluh frame bertangan. */
const CALIBRATION_SEC = 3;

/**
 * Kalibrasi status cermin KAMERA DEPAN perangkat.
 *
 * Sebagian HP menyimpan rekaman kamera depan tercermin, sebagian tidak.
 * Pengguna meletakkan satu tangan di SISI KANAN TUBUHNYA; server menentukan
 * dari posisi tangan pada berkas apakah rekaman perangkat ini tercermin,
 * lalu verdict disimpan dan dikirim otomatis pada setiap unggahan berikutnya.
 */
export default function KalibrasiKameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCamera>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const setManual = useOrientationStore((state) => state.setManual);
  const frontOrientation = useOrientationStore((state) => state.frontOrientation);
  const source = useOrientationStore((state) => state.source);

  const hasCamera = Boolean(permission?.granted);
  const canRequestPermission = permission?.canAskAgain !== false;
  const busy = isRecording || isProcessing;

  const statusLabel =
    frontOrientation === null
      ? 'Belum dikalibrasi'
      : `${frontOrientation === 'cermin' ? 'Tercermin' : 'Normal'} · ${
          source === 'manual' ? 'manual' : 'otomatis'
        }`;

  const handleCalibrate = async () => {
    if (!cameraRef.current || !cameraReady || busy) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsRecording(true);
    // Rekaman dihentikan otomatis oleh maxDuration.
    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: CALIBRATION_SEC,
      });
      setIsRecording(false);
      if (!result?.uri) {
        throw new Error('Perekaman kalibrasi gagal. Coba lagi.');
      }
      setIsProcessing(true);
      const verdict = await calibrateOrientation({
        uri: result.uri,
        fileName: 'kalibrasi.mp4',
        mimeType: 'video/mp4',
        type: 'video',
      });
      if (!verdict.reliable) {
        Alert.alert(
          'Kurang meyakinkan',
          'Posisi tangan terlalu dekat ke tengah. Letakkan tangan lebih ke sisi kanan tubuh, lalu ulangi.'
        );
        return;
      }
      setManual(verdict.orientation);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        'Kalibrasi tersimpan',
        `Kamera depan perangkat ini: ${
          verdict.orientation === 'cermin' ? 'TERCERMIN' : 'NORMAL'
        }. Semua rekaman berikutnya dikoreksi otomatis.`,
        [{ text: 'Selesai', onPress: () => router.back() }]
      );
    } catch (error) {
      setIsRecording(false);
      Alert.alert(
        'Kalibrasi gagal',
        toUserMessage(error, 'Tangan tidak terdeteksi. Pastikan tangan terlihat jelas lalu ulangi.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <BackHeader onBack={() => router.back()} title="Kalibrasi Kamera" tone="dark" />
        </View>

        <View style={styles.cameraContainer}>
          {hasCamera ? (
            <ExpoCamera
              facing="front"
              mode="video"
              mute
              onCameraReady={() => setCameraReady(true)}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              videoQuality="720p"
            />
          ) : (
            <View style={styles.permissionWrap}>
              <Ionicons color={colors.textOnPrimary} name="videocam-off-outline" size={34} />
              <Heading variant="h2" color="onPrimary" align="center">
                Izinkan akses kamera
              </Heading>
              <Text style={styles.permissionText}>
                {canRequestPermission
                  ? 'Kalibrasi butuh kamera depan untuk memeriksa orientasi rekaman.'
                  : 'Izin kamera diblokir. Aktifkan lewat Pengaturan perangkat.'}
              </Text>
              <PressableScale
                accessibilityRole="button"
                onPress={() => {
                  if (canRequestPermission) {
                    void requestPermission();
                    return;
                  }
                  void Linking.openSettings();
                }}
                style={styles.permissionBtn}
              >
                <Text variant="bodyStrong" style={styles.permissionBtnText}>
                  {canRequestPermission ? 'Izinkan Kamera' : 'Buka Pengaturan'}
                </Text>
              </PressableScale>
            </View>
          )}

          {busy ? (
            <View pointerEvents="none" style={styles.processingOverlay}>
              <View style={styles.processingCard}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={styles.processingText}>
                  {isRecording ? 'Merekam... tahan posisi tangan' : 'Menganalisis orientasi'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSheet}>
          <Text variant="bodyStrong" color="primary">
            Status: {statusLabel}
          </Text>
          <Text variant="body" color="secondary" style={styles.instruction}>
            Angkat SATU tangan dan tahan di SISI KANAN TUBUH Anda (sejajar bahu),
            lalu tekan tombol di bawah. Rekaman {CALIBRATION_SEC} detik dianalisis
            otomatis.
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Mulai kalibrasi"
            disabled={busy || !hasCamera}
            onPress={() => void handleCalibrate()}
            style={[styles.calibrateBtn, (busy || !hasCamera) && styles.calibrateBtnDisabled]}
          >
            <Ionicons color={colors.textOnAccent} name="scan-outline" size={20} />
            <Text variant="bodyStrong" style={styles.calibrateText}>
              {busy ? 'Memproses' : 'Mulai Kalibrasi'}
            </Text>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    backgroundColor: palette.ink,
    flex: 1,
  },
  container: {
    backgroundColor: palette.ink,
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cameraContainer: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  permissionWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  permissionText: {
    color: overlay.onInkTextSoft,
    textAlign: 'center',
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
  permissionBtnText: {
    color: colors.textOnAccent,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlay.inkScrim,
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
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  instruction: {
    lineHeight: 20,
  },
  calibrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTargetMin,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginTop: spacing.xs,
  },
  calibrateBtnDisabled: {
    opacity: 0.5,
  },
  calibrateText: {
    color: colors.textOnAccent,
  },
}));
