import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, overlay, radius, spacing } from '../../theme';
import GradientSurface from '../ui/GradientSurface';
import Heading from '../ui/Heading';
import Text from '../ui/Text';

export interface QuickActionsProps {
  onTranslate: () => void;
  onDictionary: () => void;
}

type GradientStops = readonly [string, string, ...string[]];

function ActionCard({
  title,
  subtitle,
  icon,
  gradient,
  textColor,
  bubbleFg,
  tilt,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradient: GradientStops;
  textColor: 'onPrimary' | 'onAccent';
  bubbleFg: string;
  tilt: number;
  onPress: () => void;
}) {
  return (
    <GradientSurface
      accessibilityLabel={title}
      colors={gradient}
      onPress={onPress}
      radius={radius.xxl}
      shadowLevel="lg"
      style={styles.card}
      contentStyle={styles.cardContent}
    >
      <View style={styles.topRow}>
        <View style={[styles.bubble, { transform: [{ rotate: `${tilt}deg` }] }]}>
          <Ionicons color={bubbleFg} name={icon} size={26} />
        </View>
        <View style={styles.chevron}>
          <Ionicons color={bubbleFg} name="arrow-forward" size={18} />
        </View>
      </View>
      <View>
        <Heading variant="h2" color={textColor} style={styles.title}>
          {title}
        </Heading>
        <Text variant="caption" color={textColor} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </GradientSurface>
  );
}

export default function QuickActions({ onTranslate, onDictionary }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <ActionCard
        bubbleFg={colors.textOnPrimary}
        gradient={gradients.primary}
        icon="scan"
        onPress={onTranslate}
        subtitle="Deteksi bahasa isyarat langsung"
        textColor="onPrimary"
        tilt={-7}
        title="Mulai Terjemah"
      />
      <ActionCard
        bubbleFg={colors.textOnAccent}
        gradient={gradients.accent}
        icon="book"
        onPress={onDictionary}
        subtitle="Pelajari kosakata isyarat"
        textColor="onAccent"
        tilt={7}
        title="Buka Kamus"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    minHeight: 178,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: overlay.onBrandStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: overlay.onBrandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
    opacity: 0.92,
  },
});
