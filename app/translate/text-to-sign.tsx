import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import TextInputArea, { TEXT_TO_SIGN_MAX_LENGTH } from '../../components/translate/TextInputArea';
import SignSequencePlayer from '../../components/translate/SignSequencePlayer';
import Badge from '../../components/ui/Badge';
import BackHeader from '../../components/ui/BackHeader';
import Heading from '../../components/ui/Heading';
import KeyboardAwareScrollView from '../../components/ui/KeyboardAwareScrollView';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, radius, spacing } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { TextToSignResult } from '../../services/translation';
import { toUserMessage } from '../../utils/errors';

import { createSheet } from '../../theme';

export default function TextToSignScreen() {
  const router = useRouter();
  // Teks dapat dikirim dari riwayat beranda untuk mengulang terjemahan.
  const { text: initialText } = useLocalSearchParams<{ text?: string }>();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const { signLanguageType, isDetecting, translateText } = useTranslation();
  const [inputValue, setInputValue] = useState(
    typeof initialText === 'string' ? initialText.slice(0, TEXT_TO_SIGN_MAX_LENGTH) : ''
  );
  const [result, setResult] = useState<TextToSignResult | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);

  // Input suara: transkrip ditambahkan setelah teks yang sudah diketik.
  const baseTextRef = useRef('');
  const { isAvailable: sttAvailable, isListening, start: startListening, stop: stopListening } = useSpeechToText({
    onResult: (transcript) => {
      const base = baseTextRef.current;
      // Transkrip suara juga tunduk batas karakter (maxLength hanya membatasi ketikan).
      setInputValue((base ? `${base} ${transcript}` : transcript).slice(0, TEXT_TO_SIGN_MAX_LENGTH));
    },
  });

  const handleMicPress = async () => {
    if (!sttAvailable) {
      Alert.alert(
        'Input Suara',
        'Input suara belum tersedia di perangkat ini. Silakan ketik pesan Anda secara manual.'
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

    try {
      const translationResult = await translateText(message);
      setResult(translationResult);

      // Getar "sukses" saat hasil terjemahan berhasil muncul.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

      // Simpan riwayat hanya untuk pengguna yang login (bukan tamu).
      if (!isGuest && user) {
        addHistoryEntry(user.id, {
          kind: 'teks-ke-isyarat',
          text: message,
          signLanguageType,
        });
      }
    } catch (error) {
      setResult(null);
      Alert.alert(
        'Terjemahan belum tersedia',
        toUserMessage(error, 'Tidak dapat menerjemahkan teks saat ini. Coba lagi sebentar lagi.')
      );
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        extraBottomSpace={spacing.xxl}
      >
        <BackHeader
          onBack={() => router.back()}
          right={<Badge text="BISINDO" variant="primary" />}
          title="Teks/Audio → Isyarat"
        />

        <Stack gap={spacing.md} style={styles.visualSection}>
          <View style={styles.visualHeader}>
            <Badge size="md" text="Peraga BISINDO aktif" variant="accent" />
            <Animated.View pointerEvents="none" style={[styles.feedbackPill, { opacity: feedbackOpacity }]}>
              <Text variant="caption" color="primary">
                Menerjemahkan...
              </Text>
            </Animated.View>
          </View>

          <View style={styles.visualBox}>
            {result?.units.length ? (
              <SignSequencePlayer units={result.units} />
            ) : (
              <View style={styles.emptyVisual}>
                <Ionicons color={colors.primary} name="hand-left-outline" size={64} />
                <Heading variant="h2" align="center" style={styles.visualTitle}>
                  Visual bahasa isyarat akan tampil di sini
                </Heading>
                <Text variant="body" color="secondary" align="center">
                  Masukkan kata atau kalimat. Gerakan akan diperagakan otomatis dan berulang.
                </Text>
              </View>
            )}
          </View>
          {result?.unmatched.length ? (
            <Text variant="caption" color="error" align="center">
              Karakter belum tersedia: {result.unmatched.join(', ')}
            </Text>
          ) : null}
        </Stack>

        <View>
          <Stack gap={spacing.sm}>
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
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    backgroundColor: colors.background,
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
  visualHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 34,
  },
  visualBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: spacing.base,
    minHeight: 320,
  },
  feedbackPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  visualTitle: {
    marginTop: spacing.xs,
  },
  emptyVisual: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 300,
  },
  sectionSubtitle: {
    marginBottom: spacing.xs,
  },
}));
