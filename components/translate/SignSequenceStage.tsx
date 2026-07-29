import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import type { TextToSignUnit } from '../../services/translation';
import { colors, radius, spacing } from '../../theme';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface SignSequenceStageProps {
  unit?: TextToSignUnit;
  /**
   * Penanda gerakan yang sedang tampil. Dipakai agar gerakan berulang dengan
   * video yang sama (mis. huruf "A A") tetap diputar ulang dari awal.
   */
  unitKey: number;
  /** Rangkaian sedang berjalan (auto-play). */
  isPlaying: boolean;
  /** Pengganda kecepatan peragaan (0,5 · 1 · 1,5). */
  speed: number;
  /** Durasi video gerakan aktif dalam milidetik (null bila belum/tidak diketahui). */
  onDurationLoaded: (durationMs: number | null, unitKey: number) => void;
  /** Dipanggil saat video gerakan selesai diputar. */
  onEnded: (unitKey: number) => void;
  /** Tap pada panggung → jeda / lanjut. */
  onTogglePlay: () => void;
}

/** URL video hanya dipakai bila unit memang bertipe video dan URL-nya ada. */
function videoUriOf(unit?: TextToSignUnit): string | null {
  if (unit?.mediaType === 'video' && unit.videoUrl) {
    return unit.videoUrl;
  }
  return null;
}

/**
 * Panggung peraga isyarat: SATU instance pemutar dipakai ulang untuk seluruh
 * rangkaian (sumber diganti lewat `replaceAsync`) sehingga perpindahan antar
 * gerakan mulus — tidak ada remount/kedip seperti saat tiap gerakan memakai
 * pemutar sendiri.
 */
export default function SignSequenceStage({
  unit,
  unitKey,
  isPlaying,
  speed,
  onDurationLoaded,
  onEnded,
  onTogglePlay,
}: SignSequenceStageProps) {
  const videoUri = videoUriOf(unit);
  const [isBuffering, setIsBuffering] = useState(false);

  // Dibaca di dalam callback async supaya tidak memakai nilai usang.
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  isPlayingRef.current = isPlaying;
  speedRef.current = speed;

  /** `unitKey` dari sumber yang benar-benar sudah dimuat ke pemutar. */
  const loadedKeyRef = useRef<number | null>(null);
  const durationMsRef = useRef<number | null>(null);
  const durationReportedRef = useRef(false);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  useEffect(() => {
    let cancelled = false;

    // Sumber lama tidak boleh lanjut terputar selama sumber baru dimuat.
    loadedKeyRef.current = null;
    durationMsRef.current = null;
    durationReportedRef.current = false;
    player.pause();

    if (!videoUri) {
      setIsBuffering(false);
      player.replaceAsync(null).catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    setIsBuffering(true);
    player
      .replaceAsync({ uri: videoUri, useCaching: true })
      .then(() => {
        if (cancelled) {
          return;
        }
        loadedKeyRef.current = unitKey;
        // playbackRate bisa ikut ter-reset saat sumber diganti.
        player.playbackRate = speedRef.current;
        if (isPlayingRef.current) {
          player.play();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsBuffering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [player, unitKey, videoUri]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  useEffect(() => {
    if (!videoUri) {
      return;
    }
    if (!isPlaying) {
      player.pause();
      return;
    }
    // Hanya putar bila sumber untuk gerakan ini memang sudah termuat.
    if (loadedKeyRef.current === unitKey) {
      player.play();
    }
  }, [isPlaying, player, unitKey, videoUri]);

  useEventListener(player, 'playToEnd', () => {
    const loadedKey = loadedKeyRef.current;
    if (loadedKey !== null) {
      onEnded(loadedKey);
    }
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    setIsBuffering(false);
    durationMsRef.current = Number.isFinite(duration) && duration > 0 ? duration * 1000 : null;
  });

  /**
   * Durasi baru dilaporkan saat pemutaran benar-benar dimulai — `sourceLoad`
   * hanya menandakan metadata siap, sehingga memakainya sebagai titik awal
   * membuat penjadwalan gerakan berikutnya terlalu cepat saat masih buffering.
   */
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    const loadedKey = loadedKeyRef.current;
    if (!playing || durationReportedRef.current || loadedKey === null) {
      return;
    }
    durationReportedRef.current = true;
    onDurationLoaded(durationMsRef.current, loadedKey);
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    setIsBuffering(status === 'loading');
  });

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Jeda peragaan' : 'Putar peragaan'}
      accessibilityState={{ selected: isPlaying }}
      onPress={onTogglePlay}
      scaleTo={0.995}
      style={styles.stage}
    >
      {videoUri ? (
        <VideoView
          accessibilityLabel={`Peragaan isyarat ${unit?.word ?? ''}`}
          contentFit="contain"
          nativeControls={false}
          player={player}
          pointerEvents="none"
          style={styles.media}
        />
      ) : unit?.imageUrl ? (
        <Image
          accessibilityLabel={`Peragaan isyarat ${unit.word}`}
          resizeMode="contain"
          source={{ uri: unit.imageUrl }}
          style={styles.media}
        />
      ) : (
        <View style={styles.emptyMedia}>
          <Ionicons color={colors.textOnPrimary} name="videocam-off-outline" size={30} />
          <Text variant="caption" color="onPrimary" align="center">
            Media peraga untuk &quot;{unit?.word ?? '-'}&quot; belum tersedia
          </Text>
        </View>
      )}

      {isBuffering ? (
        <View pointerEvents="none" style={styles.overlay}>
          <ActivityIndicator color={colors.textOnPrimary} size="large" />
        </View>
      ) : !isPlaying ? (
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.overlayBubble}>
            <Ionicons color={colors.primary} name="play" size={30} style={styles.overlayIcon} />
          </View>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = createSheet((themeColors) => ({
  stage: {
    aspectRatio: 4 / 3,
    backgroundColor: themeColors.inkNavy,
    borderRadius: radius.xl,
    overflow: 'hidden',
    width: '100%',
  },
  media: {
    height: '100%',
    width: '100%',
  },
  emptyMedia: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBubble: {
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: radius.full,
    height: 64,
    justifyContent: 'center',
    opacity: 0.94,
    width: 64,
  },
  overlayIcon: {
    marginLeft: 4,
  },
}));
