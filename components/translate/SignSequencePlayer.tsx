import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import type { TextToSignUnit } from '../../services/translation';
import { colors, fontFamily, radius, spacing, touchTargetMin } from '../../theme';
import { useSettingsStore, type SignSpeedMultiplier } from '../../store/useSettingsStore';
import useAutoHideControls from '../../hooks/useAutoHideControls';
import useVideoProgress from '../../hooks/useVideoProgress';
import type { FullscreenPhase } from '../../hooks/useFullscreenHandoff';
import { useFrameRefreshOnHandoff } from '../../hooks/useVideoFrameRefresh';
import useFullscreenVideoLayout from '../../hooks/useFullscreenVideoLayout';
import useMediaAspect from '../../hooks/useMediaAspect';
import FullscreenVideoModal from '../player/FullscreenVideoModal';
import PlayerControlsOverlay, { type SpeedOption } from '../player/PlayerControlsOverlay';
import Badge from '../ui/Badge';
import Heading from '../ui/Heading';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';
import SignSequenceStage from './SignSequenceStage';
import useSignSequenceVideo from './useSignSequenceVideo';

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

const SPEED_OPTIONS: Array<SpeedOption<SignSpeedMultiplier>> = [
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
 * tampil menyambung tanpa perlu digeser manual. Tersedia juga mode layar penuh
 * dengan kontrol lengkap (putar/jeda, ulang, lompat gerakan, geser posisi,
 * dan kecepatan).
 */
export default function SignSequencePlayer({ units }: SignSequencePlayerProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  /** Durasi video gerakan aktif; dipakai untuk menjadwalkan gerakan berikutnya. */
  const [unitDurationMs, setUnitDurationMs] = useState<number | null>(null);
  /** Bertambah setiap kali gerakan dipilih ulang agar video diputar dari awal. */
  const [playToken, setPlayToken] = useState(0);
  /** Posisi awal pemutaran gerakan aktif (berubah saat pengguna menggeser). */
  const [resumeFromMs, setResumeFromMs] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /**
   * Fase serah-terima `VideoView` yang dilaporkan modal. Panggung inline hanya
   * boleh dipasang saat `closed`, supaya tidak pernah ada dua `VideoView` hidup
   * untuk satu pemutar.
   */
  const [fullscreenPhase, setFullscreenPhase] = useState<FullscreenPhase>('closed');
  /** Kontrol tidak boleh hilang sendiri selama seek bar sedang digeser. */
  const [isScrubbing, setIsScrubbing] = useState(false);

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
      setResumeFromMs(0);
      setPlayToken((token) => token + 1);
      setIndex(normalized);
    },
    [total]
  );

  const advance = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  // Hasil terjemahan baru → mulai lagi dari gerakan pertama. Dilewati pada
  // render pertama: state awal sudah benar, dan menaikkan `playToken` di sini
  // akan memicu `replaceAsync` kedua yang balapan dengan pemuatan awal.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    chipOffsetsRef.current = {};
    resumeOnFocusRef.current = true;
    setUnitDurationMs(null);
    setResumeFromMs(0);
    setPlayToken((token) => token + 1);
    setIndex(0);
    setIsPlaying(true);
  }, [units]);

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

  const { player, videoUri, isBuffering, refreshFrame } = useSignSequenceVideo({
    isPlaying,
    onDurationLoaded: handleDurationLoaded,
    onEnded: handleEnded,
    speed,
    unit,
    unitKey: playToken,
  });

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
      // Sisa durasi dihitung dari posisi terakhir agar penggeseran manual
      // tidak membuat jaring pengaman ini melompat terlalu cepat/lambat.
      const remaining = Math.max(0, unitDurationMs - resumeFromMs);
      duration = remaining / speed + END_EVENT_GRACE_MS;
    } else {
      duration = VIDEO_WATCHDOG_MS / speed;
    }

    timerRef.current = setTimeout(advance, duration);
    return clearTimer;
  }, [
    advance,
    clearTimer,
    isPlaying,
    playToken,
    resumeFromMs,
    speed,
    total,
    unit,
    unitDurationMs,
  ]);

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

  const handleSeek = useCallback(
    (seconds: number) => {
      if (!videoUri) {
        return;
      }
      player.currentTime = seconds;
      setResumeFromMs(seconds * 1000);
    },
    [player, videoUri]
  );

  const speedLabel = useMemo(
    () => SPEED_OPTIONS.find((option) => option.value === speed)?.label ?? '1x',
    [speed]
  );

  const controls = useAutoHideControls({ autoHide: isFullscreen && isPlaying && !isScrubbing });
  const mediaAspect = useMediaAspect({
    imageUri: unit?.imageUrl ?? null,
    player,
    videoUri,
  });
  const fullscreenLayout = useFullscreenVideoLayout(mediaAspect);
  const { currentTime, duration } = useVideoProgress(
    player,
    fullscreenPhase === 'open' && controls.visible && Boolean(videoUri)
  );

  // Kontrol selalu tampil lebih dulu saat layar penuh dibuka.
  const showControls = controls.show;
  useEffect(() => {
    if (isFullscreen) {
      showControls();
    }
  }, [isFullscreen, showControls]);

  // Setelah `VideoView` berpindah wadah, surface baru perlu dipaksa menggambar
  // bila pemutar sedang dijeda — kalau tidak, panggung tampil hitam.
  useFrameRefreshOnHandoff(fullscreenPhase, refreshFrame);

  const handleFullscreenToggle = useCallback(() => {
    controls.show();
    togglePlay();
  }, [controls, togglePlay]);

  const handleFullscreenRestart = useCallback(() => {
    controls.show();
    handleRestart();
  }, [controls, handleRestart]);

  const handleFullscreenSpeed = useCallback(
    (next: SignSpeedMultiplier) => {
      controls.show();
      setSignSpeed(next);
    },
    [controls, setSignSpeed]
  );

  const handleFullscreenStep = useCallback(
    (next: number) => {
      controls.show();
      goTo(next);
    },
    [controls, goTo]
  );

  if (!unit) {
    return null;
  }

  const progress = ((index + 1) / total) * 100;

  const renderStage = (variant: 'inline' | 'fullscreen') => (
    <SignSequenceStage
      isBuffering={isBuffering}
      isPlaying={isPlaying}
      onPress={togglePlay}
      onRequestFullscreen={variant === 'inline' ? () => setIsFullscreen(true) : undefined}
      player={player}
      unit={unit}
      variant={variant}
      videoAspect={mediaAspect}
      videoUri={videoUri}
    />
  );

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

      {/* Panggung hanya boleh dirender di satu tempat: dua `VideoView` untuk
          satu pemutar membuat gambar hilang di Android. Selama serah-terima ke
          layar penuh, keduanya sengaja dikosongkan. */}
      {fullscreenPhase === 'closed' ? (
        renderStage('inline')
      ) : (
        <View style={styles.stagePlaceholder} />
      )}

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

      <FullscreenVideoModal
        onPhaseChange={setFullscreenPhase}
        onRequestClose={() => setIsFullscreen(false)}
        onSurfacePress={controls.toggle}
        renderControls={(insets) => (
          <PlayerControlsOverlay
            currentTime={currentTime}
            duration={duration}
            extraContent={
              total > 1 ? (
                <FullscreenChipStrip
                  activeIndex={index}
                  onSelect={handleFullscreenStep}
                  units={units}
                />
              ) : null
            }
            insets={insets}
            isBuffering={isBuffering}
            isPlaying={isPlaying}
            mediaBand={fullscreenLayout.band}
            onExitFullscreen={() => setIsFullscreen(false)}
            onNext={total > 1 ? () => handleFullscreenStep(index + 1) : undefined}
            onPrevious={total > 1 ? () => handleFullscreenStep(index - 1) : undefined}
            onRestart={handleFullscreenRestart}
            onScrubbingChange={setIsScrubbing}
            onSeekComplete={handleSeek}
            onSpeedChange={handleFullscreenSpeed}
            onTogglePlay={handleFullscreenToggle}
            speed={speed}
            speedOptions={SPEED_OPTIONS}
            subtitle={`Gerakan ${index + 1} dari ${total}`}
            title={unit.word}
            visible={controls.visible}
          />
        )}
        visible={isFullscreen}
      >
        {renderStage('fullscreen')}
      </FullscreenVideoModal>
    </View>
  );
}

interface FullscreenChipStripProps {
  units: TextToSignUnit[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Daftar gerakan versi layar penuh — kontras terang di atas latar gelap. */
function FullscreenChipStrip({ units, activeIndex, onSelect }: FullscreenChipStripProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const offsetsRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const offset = offsetsRef.current[activeIndex];
    if (offset !== undefined) {
      scrollRef.current?.scrollTo({ x: Math.max(0, offset - 72), animated: true });
    }
  }, [activeIndex]);

  return (
    <ScrollView
      contentContainerStyle={fullscreenChipStyles.content}
      horizontal
      ref={scrollRef}
      showsHorizontalScrollIndicator={false}
      style={fullscreenChipStyles.strip}
    >
      {units.map((item, chipIndex) => {
        const active = chipIndex === activeIndex;
        return (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Lompat ke gerakan ${chipIndex + 1}: ${item.word}`}
            accessibilityState={{ selected: active }}
            key={`${item.token}-${chipIndex}`}
            onLayout={(event) => {
              offsetsRef.current[chipIndex] = event.nativeEvent.layout.x;
            }}
            onPress={() => onSelect(chipIndex)}
            style={[fullscreenChipStyles.chip, active && fullscreenChipStyles.chipActive]}
          >
            <Text
              style={[
                fullscreenChipStyles.chipText,
                active && fullscreenChipStyles.chipTextActive,
              ]}
            >
              {item.word}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const fullscreenChipStyles = StyleSheet.create({
  strip: {
    flexGrow: 0,
    marginBottom: spacing.xs,
    maxHeight: 44,
  },
  content: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
  },
  chipTextActive: {
    color: '#101828',
  },
});

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
  stagePlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: themeColors.inkNavy,
    borderRadius: radius.xl,
    width: '100%',
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
    minHeight: 40,
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
    minHeight: 38,
    paddingHorizontal: spacing.md,
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
    minHeight: touchTargetMin,
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
