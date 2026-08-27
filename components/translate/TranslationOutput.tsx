import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius, shadow, spacing } from '../../theme';
import Heading from '../ui/Heading';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

/** Di atas panjang ini teks dianggap kalimat, bukan hasil terjemahan singkat. */
const LONG_TEXT_THRESHOLD = 28;

/** Satu tebakan yang bisa dipilih pengguna saat hasil utama tidak lolos ambang. */
export interface OutputSuggestion {
  label: string;
  confidence: number;
}

export interface TranslationOutputProps {
  text: string;
  isLoading: boolean;
  onSpeak: (text: string) => void;
  /** Jenis isyarat hasil deteksi otomatis — ditampilkan sebagai badge. */
  kindLabel?: string | null;
  /**
   * Tebakan cadangan, ditampilkan HANYA saat pengenalan tidak lolos ambang.
   *
   * Server selalu mengirim 3 kandidat teratas, termasuk ketika `text`
   * dikosongkan karena keyakinan di bawah ambang. Diukur pada protokol
   * peraga-tersembunyi, jawaban yang benar ada di dalam ketiga kandidat itu
   * pada mayoritas kasus yang tertahan — jadi menampilkannya mengubah
   * kegagalan total menjadi pilihan yang bisa diambil pengguna.
   */
  suggestions?: OutputSuggestion[];
  onPickSuggestion?: (label: string) => void;
}

export default function TranslationOutput({
  text,
  isLoading,
  onSpeak,
  kindLabel,
  suggestions,
  onPickSuggestion,
}: TranslationOutputProps) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  const showSuggestions = !isLoading && !!suggestions?.length;

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
    <View
      accessibilityLiveRegion={isLoading ? 'none' : 'polite'}
      style={[styles.container, showSuggestions && styles.containerWithSuggestions]}
    >
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
            accessibilityRole="button"
            accessibilityLabel="Putar suara hasil terjemahan"
            hitSlop={8}
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
          {/* Hasil terjemahan biasanya satu kata: tampil besar. Kalimat panjang
              (teks tunggu / catatan) memakai ukuran lebih kecil supaya tidak
              memakan tiga baris dan mengunci sheet pada tinggi maksimum. */}
          <Heading
            variant={
              showSuggestions || (text || '').length > LONG_TEXT_THRESHOLD ? 'h2' : 'title'
            }
            style={styles.text}
          >
            {text || 'Belum ada hasil terjemahan.'}
          </Heading>
        </ScrollView>
      )}

      {showSuggestions ? (
        <View style={styles.suggestionBlock}>
          <Text variant="label" color="secondary" style={styles.eyebrow}>
            MUNGKIN YANG ANDA MAKSUD
          </Text>
          <ScrollView
            contentContainerStyle={styles.suggestionRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {suggestions!.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Pilih ${item.label}, keyakinan ${Math.round(item.confidence * 100)} persen`}
                key={item.label}
                onPress={() => onPickSuggestion?.(item.label)}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text variant="body" style={styles.chipLabel}>
                  {item.label}
                </Text>
                <Text variant="label" style={styles.chipPercent}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
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
    minHeight: 132,
    maxHeight: 196,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  // Baris tebakan hanya muncul saat pengenalan gagal, jadi ruang tambahannya
  // tidak pernah memotong preview kamera pada alur yang berhasil.
  containerWithSuggestions: {
    maxHeight: 252,
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
    height: 44,
    justifyContent: 'center',
    width: 44,
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
  suggestionBlock: {
    gap: spacing.xs,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderColor: colors.primarySoft,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipLabel: {
    color: colors.primary,
    fontFamily: fontFamily.displayBold,
  },
  chipPercent: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  loadingLineLarge: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 20,
    width: '88%',
  },
  loadingLineMedium: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 20,
    width: '62%',
  },
  pressed: {
    opacity: 0.8,
  },
}));
