import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CameraView from '../../components/translate/CameraView';
import LanguageToggle from '../../components/translate/LanguageToggle';
import TranslationOutput from '../../components/translate/TranslationOutput';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';

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

  useEffect(() => {
    setTranslatedText(detectedText || WAITING_TEXT);
  }, [detectedText]);

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
          <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#FFFFFF" name="arrow-back" size={24} />
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>Isyarat → Teks</Text>
          </View>

          <LanguageToggle
            compact
            onChange={setSignLanguageType}
            theme="dark"
            value={signLanguageType}
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
            <Text style={styles.helperText}>
              {isActive ? 'Mendeteksi gerakan tangan...' : 'Ketuk tombol merah untuk mulai mendeteksi'}
            </Text>

            <Pressable
              accessibilityLabel={isActive ? 'Hentikan deteksi' : 'Mulai deteksi'}
              onPress={() => setIsActive((current) => !current)}
              style={({ pressed }) => [styles.detectButton, pressed && styles.detectButtonPressed]}
            >
              <View style={[styles.detectButtonInner, isActive && styles.detectButtonInnerActive]} />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  container: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: Layout.touchTargetMin,
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
    width: Layout.touchTargetMin,
  },
  titleGroup: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
  },
  cameraContainer: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  bottomSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    paddingBottom: Layout.spacing.xl,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  helperText: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  detectButton: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    width: 64,
  },
  detectButtonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  detectButtonInnerActive: {
    borderRadius: 6,
    height: 20,
    width: 20,
  },
  detectButtonPressed: {
    opacity: 0.88,
  },
});
