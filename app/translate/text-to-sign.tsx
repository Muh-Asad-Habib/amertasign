import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextInputArea from '../../components/translate/TextInputArea';
import Badge from '../../components/ui/Badge';
import BackHeader from '../../components/ui/BackHeader';
import BrandMark from '../../components/ui/BrandMark';
import Heading from '../../components/ui/Heading';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, radius, spacing } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { TextToSignResult } from '../../services/translation';

import { createSheet } from '../../theme';

export default function TextToSignScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const { signLanguageType, isDetecting, translateText } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<TextToSignResult | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);
  const avatarGender = useSettingsStore((state) => state.avatarGender);

  // Input suara: transkrip ditambahkan setelah teks yang sudah diketik.
  const baseTextRef = useRef('');
  const { isAvailable: sttAvailable, isListening, start: startListening, stop: stopListening } = useSpeechToText({
    onResult: (transcript) => {
      const base = baseTextRef.current;
      setInputValue(base ? `${base} ${transcript}` : transcript);
    },
  });

  const handleMicPress = async () => {
    if (!sttAvailable) {
      Alert.alert(
        'Input Suara',
        'Pengenalan suara membutuhkan development build aplikasi (belum tersedia di Expo Go). Sementara itu, ketik pesanmu secara manual.'
      );
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    baseTextRef.current = inputValue.trim();
    const started = await startListening();
    if (!started) {
      Alert.alert('Izin Mikrofon', 'Izinkan akses mikrofon untuk menggunakan input suara.');
    }
  };

  useEffect(() => {
    Animated.timing(feedbackOpacity, {
      duration: 220,
      toValue: isDetecting ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [feedbackOpacity, isDetecting]);

  const handleSubmit = async () => {
    const message = inputValue.trim();
    if (!message) {
      return;
    }

    const translationResult = await translateText(message);
    setResult(translationResult);

    // Simpan riwayat hanya untuk pengguna yang login (bukan tamu).
    if (!isGuest && user) {
      addHistoryEntry(user.id, {
        kind: 'teks-ke-isyarat',
        text: message,
        signLanguageType,
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackHeader
            onBack={() => router.back()}
            right={<Badge text="BISINDO" variant="primary" />}
            title="Teks/Audio → Isyarat"
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
              <View style={styles.avatarPill}>
                <Ionicons
                  color={colors.primary}
                  name={avatarGender === 'male' ? 'man' : 'woman'}
                  size={15}
                />
                <Text variant="label" color="primary">
                  Peraga: {avatarGender === 'male' ? 'Laki-laki' : 'Perempuan'}
                </Text>
              </View>
            </View>
          </Stack>

          <Stack gap={spacing.sm} style={styles.inputSection}>
            <Heading variant="title">Masukkan pesan</Heading>
            <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
              Ketik pesan atau gunakan mikrofon, lalu tekan tombol terjemahkan.
            </Text>
            <TextInputArea
              isListening={isListening}
              onChangeText={setInputValue}
              onMicPress={handleMicPress}
              onSubmit={handleSubmit}
              value={inputValue}
            />
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
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
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  inputSection: {
    flex: 1,
  },
  sectionSubtitle: {
    marginBottom: spacing.xs,
  },
}));
