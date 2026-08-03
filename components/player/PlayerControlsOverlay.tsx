import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, radius, spacing } from '../../theme';
import { formatPlaybackTime } from '../../hooks/useVideoProgress';
import PlayerSeekBar from './PlayerSeekBar';

export interface SpeedOption<T extends number = number> {
  value: T;
  label: string;
}

export interface PlayerControlsOverlayProps<T extends number = number> {
  /** Kontrol sedang tampil (auto-hide diatur di luar komponen ini). */
  visible: boolean;
  title?: string;
  subtitle?: string;
  isPlaying: boolean;
  isBuffering?: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onExitFullscreen: () => void;
  /** Tombol lompat gerakan; disembunyikan bila tidak diberikan. */
  onPrevious?: () => void;
  onNext?: () => void;
  currentTime: number;
  duration: number;
  /** Status geseran seek bar (true saat jari menempel). */
  onScrubbingChange?: (scrubbing: boolean) => void;
  onSeekComplete: (seconds: number) => void;
  speed: T;
  speedOptions: Array<SpeedOption<T>>;
  onSpeedChange: (speed: T) => void;
  /** Konten tambahan di atas baris kontrol (mis. strip chip gerakan). */
  extraContent?: React.ReactNode;
  insets: EdgeInsets;
}

const SCRIM_TOP = ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)'] as const;
const SCRIM_BOTTOM = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)'] as const;

/**
 * Lapisan kontrol pemutar layar penuh: sengaja minimalis (scrim gelap, ikon
 * putih, tanpa panel tambahan) agar peragaan isyarat tetap jadi fokus utama.
 */
export default function PlayerControlsOverlay<T extends number = number>({
  visible,
  title,
  subtitle,
  isPlaying,
  isBuffering = false,
  onTogglePlay,
  onRestart,
  onExitFullscreen,
  onPrevious,
  onNext,
  currentTime,
  duration,
  onScrubbingChange,
  onSeekComplete,
  speed,
  speedOptions,
  onSpeedChange,
  extraContent,
  insets,
}: PlayerControlsOverlayProps<T>) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={SCRIM_TOP}
        pointerEvents="none"
        style={[styles.scrimTop, { paddingTop: insets.top }]}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.topBar,
          { paddingTop: insets.top + spacing.xs, paddingLeft: insets.left + spacing.base, paddingRight: insets.right + spacing.base },
        ]}
      >
        <View style={styles.titleWrap} pointerEvents="none">
          {title ? (
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keluar dari layar penuh"
          hitSlop={10}
          onPress={onExitFullscreen}
          style={styles.iconButton}
        >
          <Ionicons color="#FFFFFF" name="contract-outline" size={22} />
        </Pressable>
      </View>

      <View pointerEvents="box-none" style={styles.centerRow}>
        {onPrevious ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gerakan sebelumnya"
            hitSlop={10}
            onPress={onPrevious}
            style={styles.sideButton}
          >
            <Ionicons color="#FFFFFF" name="play-skip-back" size={26} />
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}

        {isBuffering ? (
          <View style={styles.playButton}>
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Jeda peragaan' : 'Putar peragaan'}
            accessibilityState={{ selected: isPlaying }}
            hitSlop={10}
            onPress={onTogglePlay}
            style={styles.playButton}
          >
            <Ionicons
              color="#FFFFFF"
              name={isPlaying ? 'pause' : 'play'}
              size={38}
              style={isPlaying ? undefined : styles.playIconOffset}
            />
          </Pressable>
        )}

        {onNext ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gerakan berikutnya"
            hitSlop={10}
            onPress={onNext}
            style={styles.sideButton}
          >
            <Ionicons color="#FFFFFF" name="play-skip-forward" size={26} />
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>

      <LinearGradient colors={SCRIM_BOTTOM} pointerEvents="none" style={styles.scrimBottom} />

      <View
        pointerEvents="box-none"
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + spacing.sm,
            paddingLeft: insets.left + spacing.base,
            paddingRight: insets.right + spacing.base,
          },
        ]}
      >
        {extraContent}

        <PlayerSeekBar
          accentColor={colors.accent}
          currentTime={currentTime}
          duration={duration}
          onScrubbingChange={onScrubbingChange}
          onSeekComplete={onSeekComplete}
        />

        <View style={styles.bottomRow}>
          <Text style={styles.time}>
            {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
          </Text>

          <View style={styles.bottomActions}>
            <View style={styles.speedGroup}>
              {speedOptions.map((option) => {
                const active = option.value === speed;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Kecepatan peragaan ${option.label}`}
                    accessibilityState={{ selected: active }}
                    key={option.value}
                    onPress={() => onSpeedChange(option.value)}
                    style={[styles.speedChip, active && styles.speedChipActive]}
                  >
                    <Text style={[styles.speedText, active && styles.speedTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ulangi dari awal"
              hitSlop={8}
              onPress={onRestart}
              style={styles.iconButton}
            >
              <Ionicons color="#FFFFFF" name="refresh" size={20} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrimTop: {
    height: 108,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrimBottom: {
    bottom: 0,
    height: 168,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontFamily.bodyRegular,
    fontSize: 12,
    marginTop: 2,
  },
  centerRow: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.xl,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: radius.full,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  playIconOffset: {
    marginLeft: 5,
  },
  sideButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  sideSpacer: {
    height: 52,
    width: 52,
  },
  bottomBar: {
    bottom: 0,
    gap: spacing.xs,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  bottomActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  time: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  speedGroup: {
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    backgroundColor: '#FFFFFF',
  },
  speedText: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
  },
  speedTextActive: {
    color: '#101828',
  },
});
