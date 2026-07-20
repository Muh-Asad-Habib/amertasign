import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
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
import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, palette, radius, spacing } from '../../theme';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { ApiError } from '../../services/api';
import type { MediaUpload } from '../../services/translation';

import { createSheet } from '../../theme';

const WAITING_TEXT = 'Menunggu deteksi gerakan...';

export default function CameraTranslateScreen() {
  useThemeMode();
  const router = useRouter();
  const {
    signLanguageType,
    isDetecting,
    translateMedia,
  } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [stage, setStage] = useState<'abjad' | 'kata'>('abjad');
  const [translatedText, setTranslatedText] = useState(WAITING_TEXT);
  const cameraRef = useRef<CameraViewHandle>(null);
  const { speak } = useTTS();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);

  const processMedia = async (media: MediaUpload, recognitionStage: 'abjad' | 'kata') => {
    setIsActive(true);
    setTranslatedText(recognitionStage === 'kata' ? 'Menganalisis gerakan...' : 'Menganalisis bentuk tangan...');
    try {
      const result = await translateMedia(media, recognitionStage);
      const text = result.text || result.note || 'Isyarat belum dikenali. Coba ulangi dengan pencahayaan lebih baik.';
      setTranslatedText(text);
      if (result.text) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        if (!isGuest && user) {
          addHistoryEntry(user.id, {
            kind: 'isyarat-ke-teks',
            text: result.text,
            signLanguageType,
          });
        }
      }
    } catch (error) {
      setTranslatedText(WAITING_TEXT);
      Alert.alert(
        'Pengenalan gagal',
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Media tidak dapat dikenali.'
      );
    } finally {
      setIsActive(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    try {
      setIsActive(true);
      const media = await cameraRef.current.capture();
      setIsActive(false);
      await processMedia(media, stage);
    } catch (error) {
      setIsActive(false);
      Alert.alert('Kamera belum siap', error instanceof Error ? error.message : 'Gagal mengambil media.');
    }
  };

  const handleFlipCamera = () => {
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

    if (!result.canceled) {
      const asset = result.assets[0];
      const recognitionStage = asset.type === 'video' ? 'kata' : 'abjad';
      setStage(recognitionStage);
      await processMedia(
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          type: asset.type === 'video' ? 'video' : 'image',
        },
        recognitionStage
      );
    }
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
          <CameraView facing={facing} isActive={isActive} ref={cameraRef} stage={stage} />
        </View>

        <View style={styles.bottomSheet}>
          <TranslationOutput
            isLoading={isDetecting}
            onSpeak={(text) => {
              if (text !== WAITING_TEXT) {
                speak(text);
              }
            }}
            text={translatedText}
          />

          <View style={styles.controls}>
            <View style={styles.stageSelector}>
              {(['abjad', 'kata'] as const).map((item) => (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityState={{ selected: stage === item }}
                  disabled={isActive}
                  key={item}
                  onPress={() => setStage(item)}
                  style={[styles.stageButton, stage === item && styles.stageButtonActive]}
                >
                  <Text variant="label" color={stage === item ? 'onPrimary' : 'primary'}>
                    {item === 'abjad' ? 'Foto · Abjad' : 'Video 3 dtk · Kata'}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <Text variant="body" color="secondary" align="center" style={styles.helperText}>
              {isActive
                ? stage === 'kata' ? 'Rekam dan lakukan gerakan hingga selesai...' : 'Mengambil bentuk tangan...'
                : stage === 'kata' ? 'Ketuk tombol lalu lakukan satu gerakan kata' : 'Ketuk tombol untuk mengenali satu huruf'}
            </Text>

            <View style={styles.controlsRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Pilih dari galeri"
                onPress={() => {
                  void handlePickFromGallery();
                }}
                style={styles.sideButton}
              >
                <Ionicons color={colors.primary} name="images-outline" size={22} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={isActive ? 'Hentikan deteksi' : 'Mulai deteksi'}
                accessibilityState={{ selected: isActive }}
                disabled={isActive || isDetecting}
                onPress={() => void handleCapture()}
                style={styles.detectButton}
              >
                <View style={[styles.detectButtonInner, isActive && styles.detectButtonInnerActive]} />
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Balik kamera"
                onPress={handleFlipCamera}
                style={styles.sideButton}
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
    paddingVertical: spacing.md,
  },
  cameraContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingBottom: spacing.xl,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  helperText: {
    marginBottom: spacing.md,
  },
  stageSelector: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: 4,
    width: '100%',
  },
  stageButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  stageButtonActive: {
    backgroundColor: colors.primary,
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
  detectButtonInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 26,
    width: 26,
  },
  detectButtonInnerActive: {
    borderRadius: 5,
    height: 20,
    width: 20,
  },
}));
