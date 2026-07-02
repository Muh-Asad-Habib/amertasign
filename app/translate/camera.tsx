import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CameraView from '../../components/translate/CameraView';
import LanguageToggle from '../../components/translate/LanguageToggle';
import TranslationOutput from '../../components/translate/TranslationOutput';
import BackHeader from '../../components/ui/BackHeader';
import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, palette, radius, spacing } from '../../theme';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';

const WAITING_TEXT = 'Menunggu deteksi gerakan...';

export default function CameraTranslateScreen() {
  const router = useRouter();
  const {
    signLanguageType,
    setSignLanguageType,
    translatedText: detectedText,
    isDetecting,
    startDetection,
    stopDetection,
  } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [translatedText, setTranslatedText] = useState(WAITING_TEXT);
  const { speak } = useTTS();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);

  useEffect(() => {
    setTranslatedText(detectedText || WAITING_TEXT);

    // Simpan riwayat hanya untuk pengguna yang login (bukan tamu).
    if (detectedText && !isGuest && user) {
      addHistoryEntry(user.id, {
        kind: 'isyarat-ke-teks',
        text: detectedText,
        signLanguageType,
      });
    }
  }, [addHistoryEntry, detectedText, isGuest, signLanguageType, user]);

  useEffect(() => {
    if (isActive) {
      void startDetection();
      return;
    }

    stopDetection();
    setTranslatedText(WAITING_TEXT);
  }, [isActive, startDetection, stopDetection]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <BackHeader
            onBack={() => router.back()}
            right={<LanguageToggle compact onChange={setSignLanguageType} theme="dark" value={signLanguageType} />}
            title="Isyarat → Teks"
            tone="dark"
          />
        </View>

        <View style={styles.cameraContainer}>
          <CameraView isActive={isActive} />
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
            <Text variant="body" color="secondary" align="center" style={styles.helperText}>
              {isActive ? 'Mendeteksi gerakan tangan...' : 'Ketuk tombol untuk mulai mendeteksi'}
            </Text>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={isActive ? 'Hentikan deteksi' : 'Mulai deteksi'}
              accessibilityState={{ selected: isActive }}
              onPress={() => setIsActive((current) => !current)}
              style={styles.detectButton}
            >
              <View style={[styles.detectButtonInner, isActive && styles.detectButtonInnerActive]} />
            </PressableScale>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
