import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TextToSignUnit } from '../../services/translation';
import { colors, radius, spacing } from '../../theme';
import SignVideoPlayer from '../dictionary/SignVideoPlayer';
import Badge from '../ui/Badge';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';
import { createSheet } from '../../theme';

interface SignSequencePlayerProps {
  units: TextToSignUnit[];
}

export default function SignSequencePlayer({ units }: SignSequencePlayerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [units]);

  const unit = units[index];
  if (!unit) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.wordWrap}>
          <Text variant="caption" color="secondary">
            Gerakan {index + 1} dari {units.length}
          </Text>
          <Heading variant="h2">{unit.word}</Heading>
        </View>
        <Badge
          text={unit.matchType === 'spelling' ? 'Ejaan alfabet' : 'Kamus'}
          variant={unit.matchType === 'spelling' ? 'warning' : 'primary'}
        />
      </View>

      {unit.mediaType === 'video' && unit.videoUrl ? (
        <SignVideoPlayer videoUrl={unit.videoUrl} word={unit.word} />
      ) : unit.imageUrl ? (
        <View style={styles.imageFrame}>
          <Image
            accessibilityLabel={`Peragaan isyarat ${unit.word}`}
            resizeMode="contain"
            source={{ uri: unit.imageUrl }}
            style={styles.image}
          />
        </View>
      ) : (
        <SignVideoPlayer word={unit.word} />
      )}

      <Text variant="body" color="secondary" align="center">
        {unit.description}
      </Text>

      <View style={styles.controls}>
        <PressableScale
          accessibilityLabel="Gerakan sebelumnya"
          accessibilityRole="button"
          disabled={index === 0}
          onPress={() => setIndex((current) => Math.max(0, current - 1))}
          style={[styles.controlButton, index === 0 && styles.disabled]}
        >
          <Ionicons color={colors.primary} name="chevron-back" size={22} />
          <Text variant="label" color="primary">Sebelumnya</Text>
        </PressableScale>
        <View style={styles.dots}>
          {units.slice(0, 12).map((_, dotIndex) => (
            <View key={dotIndex} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <PressableScale
          accessibilityLabel="Gerakan berikutnya"
          accessibilityRole="button"
          disabled={index >= units.length - 1}
          onPress={() => setIndex((current) => Math.min(units.length - 1, current + 1))}
          style={[styles.controlButton, index >= units.length - 1 && styles.disabled]}
        >
          <Text variant="label" color="primary">Berikutnya</Text>
          <Ionicons color={colors.primary} name="chevron-forward" size={22} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = createSheet((themeColors) => ({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wordWrap: {
    flex: 1,
    gap: 2,
  },
  imageFrame: {
    aspectRatio: 16 / 9,
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: themeColors.primarySurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.35,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    backgroundColor: themeColors.border,
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: themeColors.accent,
    width: 14,
  },
}));
