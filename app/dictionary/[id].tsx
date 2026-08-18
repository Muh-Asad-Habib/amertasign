import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import useEntrySignMedia from '../../hooks/useEntrySignMedia';
import { useTTS } from '../../hooks/useTTS';
import { useThemeMode } from '../../hooks/useThemeMode';
import { CATEGORY_LABELS } from '../../constants/Dictionary';
import { avatarMediaUrl } from '../../utils/avatarMediaUrl';
import type { AvatarGender } from '../../store/useSettingsStore';

import { createSheet } from '../../theme';

const AVATAR_LABEL: Record<AvatarGender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};

export default function DictionaryDetailScreen() {
  useThemeMode();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { allEntries, isLoadingEntries, addToHistory, isFavorite, toggleFavorite } = useDictionary();
  const { speak } = useTTS();

  const entry = useMemo(() => allEntries.find((item) => item.id === entryId), [allEntries, entryId]);
  const { videoUrl, isResolving, isFallback, avatarGender } = useEntrySignMedia(entry);

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
    // Data kamus masih dimuat — jangan buru-buru menyatakan kata tidak ada.
    if (isLoadingEntries) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </SafeAreaView>
      );
    }

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

        <GradientSurface colors={gradients.primary} radius={radius.xl} shadowLevel="md" contentStyle={styles.hero}>
          <BrandMark onDark size={44} />
          <View style={styles.heroInfo}>
            <Heading variant="title" color="onPrimary" numberOfLines={2} style={styles.word}>
              {entry.word}
            </Heading>
            <Row gap={spacing.xs} wrap>
              <Badge text={entry.type.toUpperCase()} variant={entry.type === 'bisindo' ? 'accent' : 'warning'} />
              <Badge text={CATEGORY_LABELS[entry.category]} variant="neutral" />
            </Row>
          </View>
        </GradientSurface>

        <Section kicker="Belajar" title="Video Peraga">
          <Stack gap={spacing.sm}>
            {isResolving ? (
              // Media peraga alternatif sedang diminta — jangan buru-buru
              // menampilkan "media tidak tersedia".
              <View style={styles.mediaLoading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text variant="caption" color="secondary">
                  Memuat video peraga…
                </Text>
              </View>
            ) : (
              <SignVideoPlayer videoUrl={videoUrl} word={entry.word} />
            )}
            <View style={styles.avatarNote}>
              <Ionicons
                color={colors.textTertiary}
                name={avatarGender === 'male' ? 'man-outline' : 'woman-outline'}
                size={16}
              />
              <Text variant="caption" color="tertiary" style={styles.avatarNoteText}>
                Karakter peraga: {AVATAR_LABEL[avatarGender]}
                {isFallback && !isResolving
                  ? ` — video peraga ${AVATAR_LABEL[avatarGender].toLowerCase()} untuk kata ini belum tersedia, sementara memakai peraga lain.`
                  : ''}
              </Text>
            </View>
          </Stack>
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
                  fallbackImageUrl={item.imageUrl}
                  imageUrl={avatarMediaUrl(item.imageUrl, avatarGender)}
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
    flexDirection: 'row',
    gap: spacing.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  word: {
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
  },
  mediaLoading: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 220,
  },
  avatarNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  avatarNoteText: {
    flex: 1,
  },
}));
