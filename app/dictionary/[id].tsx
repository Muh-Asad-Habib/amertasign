import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import WordCard from '../../components/dictionary/WordCard';
import SignVideoPlayer from '../../components/dictionary/SignVideoPlayer';
import BackHeader from '../../components/ui/BackHeader';
import Badge from '../../components/ui/Badge';
import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Decor from '../../components/ui/Decor';
import EmptyState from '../../components/ui/EmptyState';
import GradientSurface from '../../components/ui/GradientSurface';
import Heading from '../../components/ui/Heading';
import Row from '../../components/ui/Row';
import Screen from '../../components/ui/Screen';
import Section from '../../components/ui/Section';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, gradients, radius, spacing } from '../../theme';
import { useDictionary } from '../../hooks/useDictionary';
import { useTTS } from '../../hooks/useTTS';
import { useThemeMode } from '../../hooks/useThemeMode';
import type { DictionaryCategory } from '../../types';

import { createSheet } from '../../theme';

const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  alfabet: 'Alfabet',
  angka: 'Angka',
  kata_umum: 'Kata Umum',
  frasa: 'Frasa',
};

export default function DictionaryDetailScreen() {
  useThemeMode();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { allEntries, addToHistory, isFavorite, toggleFavorite } = useDictionary();
  const { speak } = useTTS();

  const entry = useMemo(() => allEntries.find((item) => item.id === entryId), [allEntries, entryId]);

  const relatedEntries = useMemo(() => {
    if (!entry) {
      return [];
    }
    return allEntries.filter((item) => item.category === entry.category && item.id !== entry.id).slice(0, 4);
  }, [allEntries, entry]);

  useEffect(() => {
    if (entryId && entry) {
      addToHistory(entryId);
    }
  }, [addToHistory, entry, entryId]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <EmptyState
            actionLabel="Kembali"
            description="Entri kamus yang kamu cari belum tersedia atau sudah dipindahkan."
            icon="alert-circle-outline"
            onAction={() => router.back()}
            title="Kata tidak ditemukan"
          />
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(entry.id);

  return (
    <Screen scroll>
      <Decor preset="corner" />

      <Stack gap={spacing.lg}>
        <BackHeader onBack={() => router.back()} />

        <GradientSurface colors={gradients.primary} radius={radius.xxl} shadowLevel="lg" contentStyle={styles.hero}>
          <BrandMark onDark size={116} />
          <Heading variant="display" color="onPrimary" align="center" numberOfLines={2} style={styles.word}>
            {entry.word}
          </Heading>
          <Row gap={spacing.sm} justify="center" wrap>
            <Badge text={entry.type.toUpperCase()} variant={entry.type === 'bisindo' ? 'accent' : 'warning'} />
            <Badge text={CATEGORY_LABELS[entry.category]} variant="neutral" />
          </Row>
        </GradientSurface>

        <Section kicker="Belajar" title="Video Peraga">
          <SignVideoPlayer videoUrl={entry.videoUrl} word={entry.word} />
        </Section>

        <Row gap={spacing.sm}>
          <Button
            icon={<Ionicons color={favorite ? colors.textOnAccent : colors.primary} name={favorite ? 'star' : 'star-outline'} size={18} />}
            onPress={() => toggleFavorite(entry.id)}
            style={styles.actionButton}
            title="Favorit"
            variant={favorite ? 'secondary' : 'outline'}
          />
          <Button
            icon={<Ionicons color={colors.primary} name="volume-high-outline" size={18} />}
            onPress={() => speak(entry.word)}
            style={styles.actionButton}
            title="Dengarkan"
            variant="outline"
          />
        </Row>

        <Section kicker="Eksplor" title="Kata Terkait">
          {relatedEntries.length > 0 ? (
            <Stack gap={spacing.md}>
              {relatedEntries.map((item) => (
                <WordCard
                  category={CATEGORY_LABELS[item.category]}
                  imageUrl={item.imageUrl}
                  key={item.id}
                  onPress={() => router.push({ pathname: '/dictionary/[id]', params: { id: item.id } })}
                  type={item.type}
                  word={item.word}
                />
              ))}
            </Stack>
          ) : (
            <Text variant="body" color="secondary">
              Belum ada kata terkait pada kategori ini.
            </Text>
          )}
        </Section>
      </Stack>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  word: {
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
}));
