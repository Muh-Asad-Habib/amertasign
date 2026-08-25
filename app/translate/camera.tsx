import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';

import LiveSignView, { type LiveTrackerPhase } from '../../components/translate/LiveSignView';
import TranslationOutput from '../../components/translate/TranslationOutput';
import BackHeader from '../../components/ui/BackHeader';
import Badge from '../../components/ui/Badge';
import CategoryTabs from '../../components/ui/CategoryTabs';
import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import {
  colors,
  fontFamily,
  gradients,
  overlay,
  palette,
  radius,
  spacing,
  touchTargetMin,
} from '../../theme';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { toUserMessage } from '../../utils/errors';
import {
  LiveRecognitionSession,
  type LiveHand,
  type LiveStage,
} from '../../services/liveRecognition';
import {
  joinSequenceTokens,
  RECOGNITION_MODE_OPTIONS,
  resolveSignKind,
  SIGN_KIND_LABEL,
  type MediaUpload,
  type RecognitionMode,
  type SequenceKind,
  type SequenceToken,
} from '../../services/translation';

import { createSheet } from '../../theme';

const WAITING_TEXT = 'Tekan tombol rekam untuk mulai mendeteksi isyarat';
const TIMER_INTERVAL_MS = 200;

/**
 * DETEKSI LIVE — pipeline yang sama dengan aplikasi web: landmark tangan
 * dideteksi DI PERANGKAT (MediaPipe dalam WebView), lalu dikirim streaming
 * ke server sebagai JSON kecil. Tidak ada lagi unggah video dari tombol
 * rekam; unggah video/gambar tetap tersedia lewat tombol galeri.
 *
 * Mode "otomatis" hanya relevan untuk galeri (server yang memilah), jadi tab
 * live cukup Huruf | Angka | Kata.
 */
type LiveMode = Exclude<RecognitionMode, 'otomatis'>;

const LIVE_MODE_OPTIONS = RECOGNITION_MODE_OPTIONS.filter(
  (option) => option.id !== 'otomatis'
);

const STAGE_BY_LIVE_MODE: Record<LiveMode, LiveStage> = {
  huruf: 'abjad',
  angka: 'angka',
  kata: 'kata',
};

/** Panduan singkat di atas tombol rekam, per mode live. */
const MODE_HELPER_TEXT: Record<LiveMode, string> = {
  huruf: 'Ketuk rekam, tahan tiap huruf ±1–2 detik — huruf dirangkai jadi ejaan',
  angka: 'Ketuk rekam, tahan tiap angka ±1–2 detik — angka dirangkai berurutan',
  kata: 'Ketuk rekam, peragakan kata, beri jeda singkat antar kata',
};

const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

/** Jenis gabungan token untuk badge hasil: seragam → jenisnya, campur → rangkai. */
const kindOfTokens = (tokens: SequenceToken[]): SequenceKind | null => {
  if (tokens.length === 0) {
    return null;
  }
  const kinds = new Set(tokens.map((token) => token.kind));
  return kinds.size === 1 ? tokens[0].kind : 'rangkai';
};

export default function CameraTranslateScreen() {
  useThemeMode();
  const router = useRouter();
  const { signLanguageType, isDetecting, translateSequence, translateMedia } = useTranslation();

  const [permission, requestPermission] = useCameraPermissions();
  const hasCamera = Boolean(permission?.granted);
  const canRequestPermission = permission?.canAskAgain !== false;

  const [isLive, setIsLive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [facing, setFacing] = useState<CameraType>('front');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [mode, setMode] = useState<LiveMode>('kata');
  const [translatedText, setTranslatedText] = useState(WAITING_TEXT);
  const [detectedKind, setDetectedKind] = useState<SequenceKind | null>(null);
  const [trackerPhase, setTrackerPhase] = useState<LiveTrackerPhase>('loading');
  const [liveHint, setLiveHint] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [segmentBusy, setSegmentBusy] = useState(false);

  const sessionRef = useRef<LiveRecognitionSession | null>(null);
  const tokensRef = useRef<SequenceToken[]>([]);
  const startedAtRef = useRef(0);
  const { speak } = useTTS();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);

  // Kamera langsung "terhubung" saat layar dibuka: minta izin sekali di awal.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

  // Penunjuk durasi sesi live.
  useEffect(() => {
    if (!isLive) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, TIMER_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [isLive]);

  // Sesi live dihentikan bersih saat layar ditinggalkan.
  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        void session.stop();
      }
    };
  }, []);

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
      toUserMessage(error, 'Media tidak dapat dikenali. Coba ulangi dengan pencahayaan lebih baik.')
    );
  };

  // ── Sesi LIVE (tombol rekam) ──────────────────────────────────────────

  const handleFrame = useCallback((hands: LiveHand[], now: number) => {
    sessionRef.current?.handleFrame(hands, now);
  }, []);

  const handlePhase = useCallback((phase: LiveTrackerPhase, message: string) => {
    setTrackerPhase(phase);
    if (phase === 'error' && message) {
      setTranslatedText(message);
    }
  }, []);

  const startLive = useCallback(() => {
    if (sessionRef.current) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    tokensRef.current = [];
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setDetectedKind(null);
    setLiveHint('');
    setCapturing(false);
    setSegmentBusy(false);
    setTranslatedText('Peragakan isyarat di depan kamera');

    sessionRef.current = new LiveRecognitionSession({
      stage: STAGE_BY_LIVE_MODE[mode],
      callbacks: {
        onLive: (text, confidence) => {
          setLiveHint(text ? `${text} · ${Math.round(confidence * 100)}%` : '');
        },
        onCommit: (label, kind, confidence) => {
          tokensRef.current = [...tokensRef.current, { label, kind, confidence }];
          setTranslatedText(joinSequenceTokens(tokensRef.current));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        },
        onCapturing: setCapturing,
        onProcessing: setSegmentBusy,
        onError: (message) => {
          setLiveHint('');
          Alert.alert('Koneksi bermasalah', message);
        },
      },
    });
    setIsLive(true);
  }, [mode]);

  const stopLive = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    sessionRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setIsLive(false);
    setLiveHint('');
    setCapturing(false);
    setIsProcessing(true);
    try {
      // Menunggu segmen kata terakhir dikenali (flush) sebelum finalisasi.
      await session.stop();
    } finally {
      setIsProcessing(false);
      setSegmentBusy(false);
    }

    const tokens = tokensRef.current;
    const text = joinSequenceTokens(tokens);
    if (text) {
      setTranslatedText(text);
      setDetectedKind(kindOfTokens(tokens));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      saveHistory(text);
    } else {
      setTranslatedText(
        'Isyarat belum dikenali. Tahan isyarat lebih lama dan pastikan tangan terlihat jelas di bingkai.'
      );
      setDetectedKind(null);
    }
  }, [saveHistory]);

  const handleToggleLive = useCallback(() => {
    if (isProcessing) {
      return;
    }
    if (isLive) {
      void stopLive();
      return;
    }
    if (trackerPhase !== 'camera-on') {
      return;
    }
    startLive();
  }, [isLive, isProcessing, startLive, stopLive, trackerPhase]);

  // ── Galeri (jalur unggah lama — tetap tersedia sebagai cadangan) ──────

  /** Video galeri → stage otomatis: server menyegmentasi & memilih model. */
  const processGalleryVideo = async (video: MediaUpload, durationMs: number) => {
    setIsProcessing(true);
    setTranslatedText('Menganalisis rangkaian gerakan');
    setDetectedKind(null);
    try {
      const result = await translateSequence(video, durationMs, 'otomatis');
      if (result.text) {
        setTranslatedText(result.text);
        setDetectedKind(result.kind);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        saveHistory(result.text);
      } else {
        setTranslatedText(result.note || 'Isyarat belum dikenali. Coba video dengan gerakan lebih jelas.');
        setDetectedKind(null);
      }
    } catch (error) {
      showFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processGalleryImage = async (media: MediaUpload) => {
    setIsProcessing(true);
    setTranslatedText('Menganalisis bentuk tangan');
    setDetectedKind(null);
    try {
      const result = await translateMedia(media, 'auto');
      const label = result.text ?? '';
      setTranslatedText(
        label || result.note || 'Isyarat belum dikenali. Coba ulangi dengan pencahayaan lebih baik.'
      );
      if (label) {
        setDetectedKind(resolveSignKind(label, result.kind));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        saveHistory(label);
      }
    } catch (error) {
      showFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!galleryPermission.granted) {
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
      await processGalleryVideo(media, asset.duration ?? 0);
      return;
    }
    await processGalleryImage(media);
  };

  // ── UI ────────────────────────────────────────────────────────────────

  const handleFlipCamera = () => {
    // Senter hanya ada di kamera belakang — padamkan saat pindah ke depan.
    setTorchEnabled(false);
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const busy = isProcessing || isDetecting;
  const trackerReady = trackerPhase === 'camera-on';

  const helperText = isLive
    ? mode === 'kata'
      ? segmentBusy
        ? 'Mengenali gerakan'
        : capturing
          ? 'Menangkap gerakan - beri jeda untuk menutup kata'
          : liveHint
            ? `Terdeteksi: ${liveHint}`
            : 'Peragakan satu kata, lalu jeda sejenak'
      : liveHint
        ? `Terdeteksi: ${liveHint}`
        : 'Arahkan tangan ke kamera, tahan isyaratnya'
    : busy
      ? 'Menganalisis'
      : trackerReady
        ? MODE_HELPER_TEXT[mode]
        : 'Menyiapkan deteksi tangan';

  const statusText = isLive
    ? `LIVE · ${formatElapsed(elapsedMs)}`
    : busy
      ? 'Menganalisis'
      : trackerReady
        ? 'Siap mendeteksi'
        : 'Menyiapkan';

  const handleSelectMode = (id: string) => {
    setMode(id as LiveMode);
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

        <View style={styles.cameraContainer}>
          <View style={styles.cameraFrame}>
            {hasCamera ? (
              <LiveSignView
                facing={facing}
                onFrame={handleFrame}
                onPhase={handlePhase}
                torchEnabled={torchEnabled}
              />
            ) : (
              <View style={styles.permissionWrap}>
                <LinearGradient
                  colors={gradients.ink}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cameraGlyph}>
                  <Ionicons color={colors.textOnPrimary} name="videocam-off-outline" size={34} />
                </View>
                <Text variant="bodyStrong" color="onPrimary" align="center">
                  Izinkan akses kamera
                </Text>
                <Text style={styles.permissionSubtitle}>
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
              </View>
            )}

            {/* Bingkai pemindai (viewfinder) — berubah merah saat live. */}
            <View pointerEvents="none" style={[styles.corner, styles.cornerTL, isLive && styles.cornerRecording]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerTR, isLive && styles.cornerRecording]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBL, isLive && styles.cornerRecording]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBR, isLive && styles.cornerRecording]} />

            {hasCamera ? (
              <View
                accessible
                accessibilityLiveRegion="polite"
                accessibilityLabel={isLive ? 'Deteksi isyarat berjalan' : statusText}
                pointerEvents="none"
                style={[styles.statusPill, isLive && styles.statusPillRecording]}
              >
                <View style={[styles.statusDot, trackerReady && styles.statusDotReady, isLive && styles.statusDotRecording]} />
                <Text style={[styles.statusText, isLive && styles.statusTextRecording]}>{statusText}</Text>
              </View>
            ) : null}

            {facing === 'back' && hasCamera ? (
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
            <View
              pointerEvents={isLive || busy ? 'none' : 'auto'}
              style={[styles.modeBar, (isLive || busy) && styles.modeBarDisabled]}
            >
              <CategoryTabs
                activeCategory={mode}
                categories={LIVE_MODE_OPTIONS}
                centered
                onSelect={handleSelectMode}
                size="sm"
              />
            </View>

            <Text variant="body" color="secondary" align="center" style={styles.helperText}>
              {helperText}
            </Text>

            <View style={styles.controlsRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Pilih dari galeri"
                disabled={isLive || busy}
                onPress={() => {
                  void handlePickFromGallery();
                }}
                style={[styles.sideButton, (isLive || busy) && styles.sideButtonDisabled]}
              >
                <Ionicons color={colors.primary} name="images-outline" size={22} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={isLive ? 'Hentikan deteksi' : 'Mulai deteksi isyarat'}
                accessibilityState={{ selected: isLive }}
                disabled={busy || (!isLive && !trackerReady)}
                onPress={handleToggleLive}
                style={[
                  styles.detectButton,
                  isLive && styles.detectButtonRecording,
                  !isLive && (!trackerReady || busy) && styles.detectButtonDisabled,
                ]}
              >
                <View style={[styles.detectButtonInner, isLive && styles.detectButtonInnerActive]} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Balik kamera"
                disabled={busy}
                onPress={handleFlipCamera}
                style={[styles.sideButton, busy && styles.sideButtonDisabled]}
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

const CORNER = 30;

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
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
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
  cameraFrame: {
    borderRadius: radius.xxl,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
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
    position: 'absolute',
    top: spacing.base,
    left: spacing.base + CORNER + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: overlay.inkScrim,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlay.onInkBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 3,
  },
  statusPillRecording: {
    backgroundColor: overlay.errorTint,
    borderColor: overlay.errorBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.textTertiary,
  },
  statusDotReady: {
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
  torchButton: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
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
  permissionWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  cameraGlyph: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: overlay.onInkBorder,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    width: 60,
    marginBottom: spacing.sm,
  },
  permissionSubtitle: {
    color: colors.textOnPrimary,
    opacity: 0.85,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: spacing.md,
  },
  permissionBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  permissionText: {
    color: colors.textOnAccent,
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
  detectButtonDisabled: {
    opacity: 0.5,
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
