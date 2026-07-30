import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';

import { radius, spacing } from '../../theme';

import { createSheet } from '../../theme';

export interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

/** Placeholder berdenyut selama data dimuat, menggantikan layar kosong. */
export default function Skeleton({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, borderRadius, opacity: pulse }, style as ViewStyle]}
    />
  );
}

/** Kerangka satu kartu kata pada daftar kamus. */
export function WordCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={64} width={64} borderRadius={radius.lg} />
      <View style={styles.cardBody}>
        <Skeleton height={18} width="60%" />
        <Skeleton height={12} width="35%" />
      </View>
    </View>
  );
}

const styles = createSheet((colors) => ({
  base: {
    backgroundColor: colors.surfaceMuted,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.md,
  },
  cardBody: {
    flex: 1,
    gap: spacing.sm,
  },
}));
