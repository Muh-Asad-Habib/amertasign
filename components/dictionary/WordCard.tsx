import React, { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, popAt, radius, shadow, spacing } from '../../theme';
import Badge from '../ui/Badge';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';

import { createSheet } from '../../theme';

type SignType = 'bisindo';

export interface WordCardProps {
  word: string;
  category: string;
  type: SignType;
  onPress: () => void;
  imageUrl?: string;
  /** Cadangan bila `imageUrl` gagal dimuat (mis. media peraga terpilih belum ada). */
  fallbackImageUrl?: string;
  /** Indeks rotasi warna thumbnail (palet permen). Kosong = biru primer. */
  tint?: number;
}

export default function WordCard({
  word,
  category,
  type,
  onPress,
  imageUrl,
  fallbackImageUrl,
  tint,
}: WordCardProps) {
  const pop = tint != null ? popAt(tint) : null;

  // Urutan kandidat gambar: utama → cadangan; gagal semua → ikon tangan.
  const candidates = useMemo(() => {
    const urls: string[] = [];
    for (const url of [imageUrl, fallbackImageUrl]) {
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    }
    return urls;
  }, [imageUrl, fallbackImageUrl]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);
  const displayUrl = candidates[candidateIndex];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${word}, kategori ${category}, ${type}`}
      accessibilityHint="Ketuk untuk melihat detail isyarat"
      onPress={onPress}
      style={styles.container}
    >
      <View style={[styles.thumbnail, pop ? { backgroundColor: pop.surface } : null]}>
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={styles.image}
            onError={() => setCandidateIndex((index) => index + 1)}
          />
        ) : (
          <Ionicons color={pop ? pop.color : colors.primary} name="hand-left" size={26} />
        )}
      </View>

      <View style={styles.content}>
        <Heading variant="h2" numberOfLines={1}>
          {word}
        </Heading>
        <View style={styles.badges}>
          <Badge size="sm" text={category} variant="neutral" />
          <Badge size="sm" text={type.toUpperCase()} variant="primary" />
        </View>
      </View>

      <View style={styles.chevron}>
        <Ionicons color={colors.primary} name="arrow-forward" size={18} />
      </View>
    </PressableScale>
  );
}

const styles = createSheet((colors) => ({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 92,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  thumbnail: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
