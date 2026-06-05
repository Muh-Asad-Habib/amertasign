import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LanguageToggle from '../../components/translate/LanguageToggle';
import TextInputArea from '../../components/translate/TextInputArea';
import Badge from '../../components/ui/Badge';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons color={Colors.light.text} name="arrow-back" size={24} />
            </Pressable>

            <View style={styles.titleGroup}>
              <Text style={styles.title}>Teks → Isyarat</Text>
            </View>

            <LanguageToggle compact onChange={setSignLanguageType} value={signLanguageType} />
          </View>

          <View style={styles.visualSection}>
            <View style={styles.visualHeader}>
              <Badge size="md" text="Fitur dalam pengembangan" variant="accent" />
            </View>

            <View style={styles.visualBox}>
              <Animated.View pointerEvents="none" style={[styles.feedbackPill, { opacity: feedbackOpacity }]}>
                <Text style={styles.feedbackText}>Menerjemahkan...</Text>
              </Animated.View>

              <Text style={styles.handIcon}>🤟</Text>
              <Text style={styles.visualTitle}>
                {result?.description ?? 'Visual bahasa isyarat akan tampil di sini'}
              </Text>
              <Text style={styles.visualSubtitle}>
                {result?.visualUrl
                  ? `Placeholder aktif untuk ${signLanguageType.toUpperCase()}`
                  : 'Masukkan teks di bawah untuk melihat hasil terjemahan visual.'}
              </Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Masukkan pesan</Text>
            <Text style={styles.sectionSubtitle}>
              Ketik pesan singkat, lalu tekan tombol terjemahkan untuk melihat placeholder gerakan.
            </Text>
            <TextInputArea onChangeText={setInputValue} onSubmit={handleSubmit} value={inputValue} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.surface,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
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
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
  },
  visualSection: {
    marginBottom: Layout.spacing.xl,
  },
  visualHeader: {
    marginBottom: Layout.spacing.md,
  },
  visualBox: {
    alignItems: 'center',
    aspectRatio: 4 / 3,
    backgroundColor: '#F1F5F9',
    borderColor: '#DBEAFE',
    borderRadius: Layout.radius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: Layout.spacing.xl,
  },
  feedbackPill: {
    backgroundColor: '#DBEAFE',
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    position: 'absolute',
    right: Layout.spacing.md,
    top: Layout.spacing.md,
  },
  feedbackText: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  handIcon: {
    fontSize: 54,
    marginBottom: Layout.spacing.md,
  },
  visualTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.lg,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  visualSubtitle: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputSection: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    marginBottom: Layout.spacing.md,
  },
});
