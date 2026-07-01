import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import LanguageToggle from '../../components/translate/LanguageToggle';
import TextInputArea from '../../components/translate/TextInputArea';
import Badge from '../../components/ui/Badge';
import BackHeader from '../../components/ui/BackHeader';
import BrandMark from '../../components/ui/BrandMark';
import Heading from '../../components/ui/Heading';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, radius, spacing } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';
import type { TextToSignResult } from '../../services/translation';

export default function TextToSignScreen() {
  const router = useRouter();
  const { signLanguageType, setSignLanguageType, isDetecting, translateText } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<TextToSignResult | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(feedbackOpacity, {
      duration: 220,
      toValue: isDetecting ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [feedbackOpacity, isDetecting]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      return;
    }

    const translationResult = await translateText(inputValue);
    setResult(translationResult);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackHeader
            onBack={() => router.back()}
            right={<LanguageToggle compact onChange={setSignLanguageType} value={signLanguageType} />}
            title="Teks → Isyarat"
          />

          <Stack gap={spacing.md} style={styles.visualSection}>
            <Badge size="md" text="Fitur dalam pengembangan" variant="accent" />

            <View style={styles.visualBox}>
              <Animated.View pointerEvents="none" style={[styles.feedbackPill, { opacity: feedbackOpacity }]}>
                <Text variant="caption" color="primary">
                  Menerjemahkan...
                </Text>
              </Animated.View>

              <BrandMark size={92} />
              <Heading variant="h2" align="center" style={styles.visualTitle}>
                {result?.description ?? 'Visual bahasa isyarat akan tampil di sini'}
              </Heading>
              <Text variant="body" color="secondary" align="center">
                {result?.visualUrl
                  ? `Placeholder aktif untuk ${signLanguageType.toUpperCase()}`
                  : 'Masukkan teks di bawah untuk melihat hasil terjemahan visual.'}
              </Text>
            </View>
          </Stack>

          <Stack gap={spacing.sm} style={styles.inputSection}>
            <Heading variant="title">Masukkan pesan</Heading>
            <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
              Ketik pesan singkat, lalu tekan tombol terjemahkan untuk melihat placeholder gerakan.
            </Text>
            <TextInputArea onChangeText={setInputValue} onSubmit={handleSubmit} value={inputValue} />
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  visualSection: {
    marginTop: spacing.sm,
  },
  visualBox: {
    alignItems: 'center',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.xl,
    gap: spacing.md,
  },
  feedbackPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  visualTitle: {
    marginTop: spacing.xs,
  },
  inputSection: {
    flex: 1,
  },
  sectionSubtitle: {
    marginBottom: spacing.xs,
  },
});
