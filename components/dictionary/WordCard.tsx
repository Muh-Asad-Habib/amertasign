import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing } from '../../theme';
import Badge from '../ui/Badge';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';

type SignType = 'bisindo' | 'sibi';

export interface WordCardProps {
  word: string;
  category: string;
  type: SignType;
  onPress: () => void;
  imageUrl?: string;
}

export default function WordCard({ word, category, type, onPress, imageUrl }: WordCardProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={word}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.thumbnail}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Ionicons color={colors.primary} name="hand-left" size={26} />
        )}
      </View>

      <View style={styles.content}>
        <Heading variant="h2" numberOfLines={1}>
          {word}
        </Heading>
        <View style={styles.badges}>
          <Badge size="sm" text={category} variant="neutral" />
          <Badge size="sm" text={type.toUpperCase()} variant={type === 'bisindo' ? 'primary' : 'accent'} />
        </View>
      </View>

      <View style={styles.chevron}>
        <Ionicons color={colors.primary} name="chevron-forward" size={20} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1.5,
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
});
