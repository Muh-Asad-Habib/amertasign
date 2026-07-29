import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import type { TextToSignUnit } from '../../services/translation';
import { colors, radius, spacing } from '../../theme';
import { useSettingsStore, type SignSpeedMultiplier } from '../../store/useSettingsStore';
import Badge from '../ui/Badge';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';
import SignSequenceStage from './SignSequenceStage';

import { createSheet } from '../../theme';

interface SignSequencePlayerProps {
  units: TextToSignUnit[];
}

/** Lama tampil satu gerakan yang bukan video (gambar / media kosong). */
const BASE_DWELL_MS = 1600;
/**
 * Cadangan bila durasi video tidak diketahui dan `playToEnd` tidak pernah
 * terkirim, supaya rangkaian tidak berhenti di tengah jalan.
 */
const VIDEO_WATCHDOG_MS = 9000;
/** Toleransi agar event `playToEnd` tetap diberi kesempatan lebih dulu. */
const END_EVENT_GRACE_MS = 450;

const SPEED_OPTIONS: Array<{ value: SignSpeedMultiplier; label: string }> = [
  { value: 0.5, label: '0,5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1,5x' },
];

const AVATAR_LABEL: Record<'male' | 'female', string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};

const isVideoUnit = (unit?: TextToSignUnit) =>
  Boolean(unit && unit.mediaType === 'video' && unit.videoUrl);

/**
 * Pemutar rangkaian peraga isyarat: gerakan berjalan otomatis satu per satu
 * dan mengulang dari awal setelah gerakan terakhir (looping), sehingga kalimat
 * tampil menyambung tanpa perlu digeser manual.
 */
export default function SignSequencePlayer({ units }: SignSequencePlayerProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  /** Durasi video gerakan aktif; dipakai untuk menjadwalkan gerakan berikutnya. */
  const [unitDurationMs, setUnitDurationMs] = useState<number | null>(null);
  /** Bertambah setiap kali gerakan dipilih ulang agar video diputar dari awal. */
  const [playToken, setPlayToken] = useState(0);

  const speed = useSettingsStore((state) => state.signSpeed);
  const setSignSpeed = useSettingsStore((state) => state.setSignSpeed);
  const avatarGender = useSettingsStore((state) => state.avatarGender);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipStripRef = useRef<ScrollView | null>(null);
  const chipOffsetsRef = useRef<Record<number, number>>({});
  /** Cerminan `isPlaying` untuk dibaca di cleanup useFocusEffect. */
  const isPlayingRef = useRef(true);
  /** Status yang dipulihkan saat layar kembali difokuskan. */
  const resumeOnFocusRef = useRef(true);

  const total = units.length;
  const unit = units[index];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) {
        return;
      }
      const normalized = ((next % total) + total) % total;
      setUnitDurationMs(null);
      setPlayToken((token) => token + 1);
      setIndex(normalized);
    },
    [total]
  );

  const advance = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  // Hasil terjemahan baru → mulai lagi dari gerakan pertama.
  useEffect(() => {
    chipOffsetsRef.current = {};
    resumeOnFocusRef.current = true;
    setUnitDurationMs(null);
    setPlayToken((token) => token + 1);
    setIndex(0);
    setIsPlaying(true);
  }, [units]);

  /**
   * Penjadwalan perpindahan gerakan. Video idealnya berpindah lewat event
   * `playToEnd`; timer di bawah adalah jaring pengaman agar rangkaian tidak
   * berhenti bila event tersebut tidak terkirim (video gagal dimuat / codec).
   */
  useEffect(() => {
    clearTimer();
    if (!isPlaying || total === 0) {
      return;
    }

    let duration: number;
    if (!isVideoUnit(unit)) {
      duration = BASE_DWELL_MS / speed;
    } else if (unitDurationMs) {
      duration = unitDurationMs / speed + END_EVENT_GRACE_MS;
    } else {
      duration = VIDEO_WATCHDOG_MS / speed;
    }

    timerRef.current = setTimeout(advance, duration);
    return clearTimer;
  }, [advance, clearTimer, isPlaying, playToken, speed, total, unit, unitDurationMs]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Berhenti memutar saat layar ditinggalkan, lanjut lagi saat kembali
  // (kecuali pengguna memang sengaja menjeda sebelum berpindah layar).
  useFocusEffect(
    useCallback(() => {
      setIsPlaying(resumeOnFocusRef.current);
      return () => {
        resumeOnFocusRef.current = isPlayingRef.current;
        setIsPlaying(false);
      };
    }, [])
  );

  // Chip gerakan aktif selalu terlihat.
  useEffect(() => {
    const offset = chipOffsetsRef.current[index];
    if (offset !== undefined) {
      chipStripRef.current?.scrollTo({ x: Math.max(0, offset - 72), animated: true });
    }
  }, [index]);

  // Event pemutar dibawa bersama `unitKey`-nya: hasil dari sumber lama yang
  // datang terlambat diabaikan agar tidak melompati satu gerakan.
  const handleEnded = useCallback(
    (token: number) => {
      if (token !== playToken || !isPlaying) {
        return;
      }
      advance();
    },
    [advance, isPlaying, playToken]
  );

  const handleDurationLoaded = useCallback(
    (durationMs: number | null, token: number) => {
      if (token !== playToken) {
        return;
      }
      setUnitDurationMs(durationMs);
    },
    [playToken]
  );

  const handleRestart = useCallback(() => {
    goTo(0);
    resumeOnFocusRef.current = true;
    setIsPlaying(true);
  }, [goTo]);

  const togglePlay = useCallback(() => {
    const next = !isPlayingRef.current;
    resumeOnFocusRef.current = next;
    setIsPlaying(next);
  }, []);

  const speedLabel = useMemo(
    () => SPEED_OPTIONS.find((option) => option.value === speed)?.label ?? '1x',
    [speed]
  );

  if (!unit) {
    return null;
  }

  const progress = ((index + 1) / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.wordWrap}>
          <Text variant="kicker" color="secondary">
            Gerakan {index + 1} dari {total}
          </Text>
          <Heading variant="title" numberOfLines={1}>
            {unit.word}
          </Heading>
        </View>
        <Badge
          text={unit.matchType === 'spelling' ? 'Ejaan alfabet' : 'Kamus'}
          variant={unit.matchType === 'spelling' ? 'warning' : 'primary'}
        />
      </View>

      <SignSequenceStage
        isPlaying={isPlaying}
        onDurationLoaded={handleDurationLoaded}
        onEnded={handleEnded}
        onTogglePlay={togglePlay}
        speed={speed}
        unit={unit}
        unitKey={playToken}
      />

      {unit.description ? (
        <Text variant="caption" color="secondary" align="center" numberOfLines={2}>
          {unit.description}
        </Text>
      ) : null}

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text variant="label" color="secondary">
            {isPlaying ? 'Berjalan otomatis' : 'Dijeda'} · {speedLabel}
          </Text>
          <Text variant="label" color="tertiary">
            Mengulang terus
          </Text>
        </View>
      </View>

      {total > 1 ? (
        <ScrollView
          contentContainerStyle={styles.chipStripContent}
          horizontal
          ref={chipStripRef}
          showsHorizontalScrollIndicator={false}
          style={styles.chipStrip}
        >
          {units.map((item, chipIndex) => {
            const active = chipIndex === index;
            return (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Lompat ke gerakan ${chipIndex + 1}: ${item.word}`}
                accessibilityState={{ selected: active }}
                key={`${item.token}-${chipIndex}`}
                onLayout={(event) => {
                  chipOffsetsRef.current[chipIndex] = event.nativeEvent.layout.x;
                }}
                onPress={() => goTo(chipIndex)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text variant="label" color={active ? 'onPrimary' : 'secondary'}>
                  {item.word}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.mainControls}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Ulangi dari gerakan pertama"
          onPress={handleRestart}
          style={styles.secondaryRound}
        >
          <Ionicons color={colors.primary} name="refresh" size={20} />
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Jeda peragaan' : 'Putar peragaan'}
          accessibilityState={{ selected: isPlaying }}
          haptic
          onPress={togglePlay}
          style={styles.playButton}
        >
          <Ionicons
            color={colors.textOnPrimary}
            name={isPlaying ? 'pause' : 'play'}
            size={26}
            style={isPlaying ? undefined : styles.playIconOffset}
          />
        </PressableScale>

        <View style={styles.speedGroup}>
          {SPEED_OPTIONS.map((option) => {
            const active = option.value === speed;
            return (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Kecepatan peragaan ${option.label}`}
                accessibilityState={{ selected: active }}
                key={option.value}
                onPress={() => setSignSpeed(option.value)}
                style={[styles.speedChip, active && styles.speedChipActive]}
              >
                <Text variant="label" color={active ? 'onPrimary' : 'secondary'}>
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View style={styles.stepControls}>
        <PressableScale
          accessibilityLabel="Gerakan sebelumnya"
          accessibilityRole="button"
          onPress={() => goTo(index - 1)}
          style={styles.stepButton}
        >
          <Ionicons color={colors.primary} name="chevron-back" size={18} />
          <Text variant="label" color="primary">
            Sebelumnya
          </Text>
        </PressableScale>
        <PressableScale
          accessibilityLabel="Gerakan berikutnya"
          accessibilityRole="button"
          onPress={() => goTo(index + 1)}
          style={styles.stepButton}
        >
          <Text variant="label" color="primary">
            Berikutnya
          </Text>
          <Ionicons color={colors.primary} name="chevron-forward" size={18} />
        </PressableScale>
      </View>

      <View style={styles.avatarNote}>
        <Ionicons
          color={colors.textTertiary}
          name={avatarGender === 'male' ? 'man-outline' : 'woman-outline'}
          size={16}
        />
        <Text variant="caption" color="tertiary" style={styles.avatarNoteText}>
          Karakter peraga: {AVATAR_LABEL[avatarGender]}
        </Text>
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
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  wordWrap: {
    flex: 1,
    gap: 2,
  },
  progressBlock: {
    gap: spacing.xs,
  },
  progressTrack: {
    backgroundColor: themeColors.surfaceMuted,
    borderRadius: radius.full,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: themeColors.accent,
    borderRadius: radius.full,
    height: '100%',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipStrip: {
    marginHorizontal: -spacing.xs,
  },
  chipStripContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    backgroundColor: themeColors.surfaceMuted,
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: themeColors.primary,
  },
  mainControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: themeColors.primary,
    borderRadius: radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playIconOffset: {
    marginLeft: 3,
  },
  secondaryRound: {
    alignItems: 'center',
    backgroundColor: themeColors.primarySurface,
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  speedGroup: {
    backgroundColor: themeColors.surfaceMuted,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  speedChip: {
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  speedChipActive: {
    backgroundColor: themeColors.primary,
  },
  stepControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: themeColors.primarySurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
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
