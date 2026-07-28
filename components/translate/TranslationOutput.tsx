import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius, shadow, spacing } from '../../theme';
import Heading from '../ui/Heading';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface TranslationOutputProps {
  text: string;
  isLoading: boolean;
  onSpeak: (text: string) => void;
  /** Jenis isyarat hasil deteksi otomatis — ditampilkan sebagai badge. */
  kindLabel?: string | null;
}

export default function TranslationOutput({ text, isLoading, onSpeak, kindLabel }: TranslationOutputProps) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isLoading) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isLoading, pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="label" color="secondary" style={styles.eyebrow}>
            HASIL TERJEMAHAN
          </Text>
          {!isLoading && kindLabel ? (
            <View style={styles.kindBadge}>
              <Text variant="label" style={styles.kindBadgeText}>
                {kindLabel.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        {!isLoading ? (
          <Pressable
            accessibilityLabel="Putar suara hasil terjemahan"
            onPress={() => onSpeak(text)}
            style={({ pressed }) => [styles.speakButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primary} name="volume-high" size={22} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <Animated.View style={[styles.loadingContainer, { opacity: pulse }]}>
          <View style={styles.loadingLineLarge} />
          <View style={styles.loadingLineMedium} />
          <Text variant="body" color="secondary">
            Mendeteksi gerakan...
          </Text>
        </Animated.View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.textScrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.textScroll}
        >
          <Heading variant="title" style={styles.text}>
            {text || 'Belum ada hasil terjemahan.'}
          </Heading>
        </ScrollView>
      )}
    </View>
  );
}

const styles = createSheet((colors) => ({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    // Tinggi dikunci pada rentang tetap supaya hasil terjemahan yang panjang
    // tidak mendorong bottom sheet naik dan memotong preview kamera.
    minHeight: 184,
    maxHeight: 232,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.sm,
  },
  kindBadge: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primarySoft,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  kindBadgeText: {
    color: colors.primary,
    letterSpacing: 0.6,
  },
  eyebrow: {
    letterSpacing: 0.3,
  },
  speakButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  text: {
    fontFamily: fontFamily.displayBold,
  },
  textScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  textScrollContent: {
    paddingBottom: spacing.xs,
  },
  loadingContainer: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  loadingLineLarge: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 24,
    width: '88%',
  },
  loadingLineMedium: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 24,
    width: '62%',
  },
  pressed: {
    opacity: 0.8,
  },
}));
