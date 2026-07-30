import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { radius, shadow, spacing } from '../../theme';
import PressableScale from './PressableScale';
import Text from './Text';

import { createSheet } from '../../theme';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Dipanggil saat durasi tampil habis. */
  onDismiss?: () => void;
  durationMs?: number;
}

/** Notifikasi singkat di bawah layar, mendukung aksi urung (undo). */
export default function Snackbar({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 5000,
}: SnackbarProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 16,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    if (!visible || !onDismiss) {
      return;
    }

    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss, opacity, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
    >
      <View accessibilityLiveRegion="polite" style={styles.bar}>
        <Text variant="body" style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={styles.action}
          >
            <Text variant="bodyStrong" style={styles.actionText}>
              {actionLabel}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = createSheet((colors) => ({
  wrap: {
    bottom: spacing.xl,
    left: spacing.base,
    position: 'absolute',
    right: spacing.base,
    zIndex: 10,
  },
  bar: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadow.lg,
  },
  message: {
    color: colors.background,
    flex: 1,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    color: colors.accent,
  },
}));
