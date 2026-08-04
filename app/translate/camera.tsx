import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import type { CameraType } from 'expo-camera';

import CameraView, { type CameraViewHandle } from '../../components/translate/CameraView';
import TranslationOutput from '../../components/translate/TranslationOutput';
import BackHeader from '../../components/ui/BackHeader';
import Badge from '../../components/ui/Badge';
import CategoryTabs from '../../components/ui/CategoryTabs';
import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, overlay, palette, radius, spacing, touchTargetMin } from '../../theme';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { toUserMessage } from '../../utils/errors';
import {
  classifySignLabel,
  isLetterLabel,
  pickCandidate,
  RECOGNITION_MODE_OPTIONS,
  SIGN_KIND_LABEL,
  type MediaUpload,
  type RecognitionMode,
  type SequenceKind,
} from '../../services/translation';

import { createSheet } from '../../theme';

const WAITING_TEXT = 'Tekan tombol rekam untuk mulai mendeteksi isyarat...';
/** Batas aman durasi rekaman agar berkas unggahan tidak membengkak. */
const MAX_RECORDING_SEC = 15;
/** Jeda minimum sebelum perekaman boleh dihentikan (native butuh waktu siap). */
const MIN_RECORDING_MS = 800;
const TIMER_INTERVAL_MS = 200;

/** Panduan singkat di atas tombol rekam, disesuaikan mode yang dikunci. */
const MODE_HELPER_TEXT: Record<RecognitionMode, string> = {
  otomatis: 'Ketuk rekam, peragakan isyarat, lalu ketuk lagi untuk berhenti',
  huruf: 'Tahan tiap huruf ±2 detik — beberapa huruf dirangkai jadi ejaan',
  angka: 'Peragakan satu angka, tahan sampai gerakan selesai',
  kata: 'Peragakan satu kata, tahan sampai gerakan selesai',
};

/** Teks status selama hasil rekaman diproses. */
const MODE_PROCESSING_TEXT: Record<RecognitionMode, string> = {
  otomatis: 'Menganalisis rangkaian gerakan...',
  huruf: 'Menganalisis rangkaian huruf...',
  angka: 'Menganalisis isyarat angka...',
  kata: 'Menganalisis isyarat kata...',
};

/** Mode yang hanya bisa dijalankan model video — gambar galeri tidak didukung. */
const VIDEO_ONLY_MODES: RecognitionMode[] = ['angka', 'kata'];

export default function CameraTranslateScreen() {
  useThemeMode();
  const router = useRouter();
  const {
    signLanguageType,
    isDetecting,
    translateSequence,
    translateMedia,
  } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [facing, setFacing] = useState<CameraType>('front');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [mode, setMode] = useState<RecognitionMode>('otomatis');
  const [translatedText, setTranslatedText] = useState(WAITING_TEXT);
  const [detectedKind, setDetectedKind] = useState<SequenceKind | null>(null);
  const cameraRef = useRef<CameraViewHandle>(null);
  const startedAtRef = useRef(0);
  const { speak } = useTTS();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);

  // Penunjuk waktu rekaman + hentikan otomatis saat batas aman tercapai.
  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_RECORDING_SEC * 1000) {
        cameraRef.current?.stopRecording();
      }
    }, TIMER_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isRecording]);

  const saveHistory = useCallback(
    (text: string) => {
      if (!isGuest && user) {
        addHistoryEntry(user.id, {
          kind: 'isyarat-ke-teks',
          text,
          signLanguageType,
        });
      }
    },
    [addHistoryEntry, isGuest, signLanguageType, user]
  );

  const showFailure = (error: unknown) => {
    setTranslatedText(WAITING_TEXT);
    setDetectedKind(null);
    Alert.alert(
      'Pengenalan gagal',
      toUserMessage(error, 'Media tidak dapat dikenali. Coba rekam ulang dengan pencahayaan lebih baik.')
    );
  };

  /** Rekaman video → rangkaian isyarat (beberapa huruf/angka + kata). */
  const processRecording = async (video: MediaUpload, durationMs: number) => {
    setIsProcessing(true);
    setTranslatedText(MODE_PROCESSING_TEXT[mode]);
    setDetectedKind(null);
    try {
      const result = await translateSequence(video, durationMs, mode);
      if (result.text) {
        setTranslatedText(result.text);
        setDetectedKind(result.kind);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        saveHistory(result.text);
      } else {
        setTranslatedText(result.note || 'Isyarat belum dikenali. Coba ulangi dengan gerakan lebih jelas.');
        setDetectedKind(null);
      }
    } catch (error) {
      showFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Gambar dari galeri hanya bisa dikenali model abjad (huruf). */
  const processImage = async (media: MediaUpload) => {
    setIsProcessing(true);
    setTranslatedText('Menganalisis bentuk tangan...');
    setDetectedKind(null);
    try {
      const result = await translateMedia(media, 'abjad');
      // Mode huruf menolak label non-huruf agar konsisten dengan jalur rekaman.
      const picked = mode === 'huruf' ? pickCandidate(result, isLetterLabel) : null;
      const label = mode === 'huruf' ? picked?.label ?? '' : result.text ?? '';
      const fallback =
        mode === 'huruf'
          ? 'Tidak ada isyarat huruf yang dikenali. Coba ulangi dengan pencahayaan lebih baik.'
          : result.note || 'Isyarat belum dikenali. Coba ulangi dengan pencahayaan lebih baik.';

      setTranslatedText(label || fallback);
      if (label) {
        setDetectedKind(classifySignLabel(label));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        saveHistory(label);
      }
    } catch (error) {
      showFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
      // Perekam native butuh jeda singkat sebelum bisa dihentikan; klip yang
      // terlalu pendek juga hampir mustahil dikenali model.
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed < MIN_RECORDING_MS) {
        setTimeout(() => cameraRef.current?.stopRecording(), MIN_RECORDING_MS - elapsed);
        return;
      }
      cameraRef.current?.stopRecording();
      return;
    }

    if (!cameraRef.current) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setDetectedKind(null);
    setTranslatedText('Merekam isyarat... ketuk lagi untuk berhenti.');
    setIsRecording(true);

    try {
      // Promise ini baru selesai setelah stopRecording() dipanggil.
      const video = await cameraRef.current.startRecording(MAX_RECORDING_SEC);
      const durationMs = Date.now() - startedAtRef.current;
      setIsRecording(false);
      await processRecording(video, durationMs);
    } catch (error) {
      setIsRecording(false);
      showFailure(error);
    }
  };

  const handleFlipCamera = () => {
    if (isRecording) {
      return;
    }
    // Senter hanya ada di kamera belakang — padamkan saat pindah ke depan.
    setTorchEnabled(false);
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Galeri', 'Izinkan akses galeri untuk menerjemahkan foto atau video isyarat.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const media: MediaUpload = {
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      type: asset.type === 'video' ? 'video' : 'image',
    };

    if (media.type === 'video') {
      await processRecording(media, asset.duration ?? 0);
      return;
    }

    // Angka & kata hanya ada di model video; server menolak gambar pada
    // stage=kata (400 STAGE_MEDIA_MISMATCH), jadi dicegah sebelum dikirim.
    if (VIDEO_ONLY_MODES.includes(mode)) {
      Alert.alert(
        'Butuh rekaman video',
        'Mode Angka dan Kata membutuhkan rekaman video. Untuk gambar, pilih mode Huruf atau Otomatis.'
      );
      return;
    }

    await processImage(media);
  };

  const busy = isProcessing || isDetecting;
  // Sengaja ringkas: teks ini duduk di atas tombol rekam, dan setiap baris
  // tambahan langsung memangkas tinggi pratinjau kamera di atasnya.
  const helperText = isRecording
    ? `Tahan tiap isyarat ±2 detik (maks ${MAX_RECORDING_SEC} dtk)`
    : busy
      ? MODE_PROCESSING_TEXT[mode]
      : MODE_HELPER_TEXT[mode];

  const handleSelectMode = (id: string) => {
    setMode(id as RecognitionMode);
    setTranslatedText(WAITING_TEXT);
    setDetectedKind(null);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <BackHeader
            onBack={() => router.back()}
            right={<Badge text="BISINDO" variant="accent" />}
            title="Isyarat → Teks/Audio"
            tone="dark"
          />
        </View>

        <View
          pointerEvents={isRecording || busy ? 'none' : 'auto'}
          style={[styles.modeBar, (isRecording || busy) && styles.modeBarDisabled]}
        >
          <CategoryTabs
            activeCategory={mode}
            categories={RECOGNITION_MODE_OPTIONS}
            contentPadding={spacing.lg}
            onSelect={handleSelectMode}
          />
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            elapsedMs={elapsedMs}
            facing={facing}
            isProcessing={busy}
            isRecording={isRecording}
            ref={cameraRef}
            torchEnabled={torchEnabled}
          />
          {facing === 'back' ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={torchEnabled ? 'Matikan senter' : 'Nyalakan senter'}
              accessibilityState={{ selected: torchEnabled }}
              onPress={() => setTorchEnabled((value) => !value)}
              style={[styles.torchButton, torchEnabled && styles.torchButtonActive]}
            >
              <Ionicons
                color={torchEnabled ? colors.textOnAccent : colors.textOnPrimary}
                name={torchEnabled ? 'flash' : 'flash-off'}
                size={20}
              />
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.bottomSheet}>
          <TranslationOutput
            isLoading={busy}
            kindLabel={detectedKind ? SIGN_KIND_LABEL[detectedKind] : null}
            onSpeak={(text) => {
              if (text !== WAITING_TEXT) {
                speak(text);
              }
            }}
            text={translatedText}
          />

          <View style={styles.controls}>
            <Text variant="body" color="secondary" align="center" style={styles.helperText}>
              {helperText}
            </Text>

            <View style={styles.controlsRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Pilih dari galeri"
                disabled={isRecording || busy}
                onPress={() => {
                  void handlePickFromGallery();
                }}
                style={[styles.sideButton, (isRecording || busy) && styles.sideButtonDisabled]}
              >
                <Ionicons color={colors.primary} name="images-outline" size={22} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={isRecording ? 'Hentikan rekaman' : 'Mulai rekam isyarat'}
                accessibilityState={{ selected: isRecording }}
                disabled={busy}
                onPress={() => void handleToggleRecording()}
                style={[styles.detectButton, isRecording && styles.detectButtonRecording]}
              >
                <View style={[styles.detectButtonInner, isRecording && styles.detectButtonInnerActive]} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Balik kamera"
                disabled={isRecording || busy}
                onPress={handleFlipCamera}
                style={[styles.sideButton, (isRecording || busy) && styles.sideButtonDisabled]}
              >
                <Ionicons color={colors.primary} name="camera-reverse-outline" size={22} />
              </PressableScale>
            </View>
          </View>
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
  modeBar: {
    flexShrink: 0,
    paddingBottom: spacing.xs,
  },
  modeBarDisabled: {
    opacity: 0.4,
  },
  cameraContainer: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  torchButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radius.full,
    backgroundColor: overlay.inkScrim,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  torchButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    flexShrink: 0,
    paddingBottom: spacing.lg,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  helperText: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonDisabled: {
    opacity: 0.4,
  },
  detectButton: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
    borderWidth: 4,
    borderColor: colors.errorTint,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  detectButtonRecording: {
    borderColor: colors.error,
    borderWidth: 6,
    backgroundColor: colors.surface,
  },
  detectButtonInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: 26,
    width: 26,
  },
  detectButtonInnerActive: {
    backgroundColor: colors.error,
    borderRadius: 6,
    height: 26,
    width: 26,
  },
}));
