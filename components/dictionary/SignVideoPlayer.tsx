import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';

import { colors, radius, spacing } from '../../theme';
import { useSettingsStore, type SignSpeedMultiplier } from '../../store/useSettingsStore';
import useAutoHideControls from '../../hooks/useAutoHideControls';
import useVideoProgress from '../../hooks/useVideoProgress';
import FullscreenVideoModal from '../player/FullscreenVideoModal';
import PlayerControlsOverlay, { type SpeedOption } from '../player/PlayerControlsOverlay';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface SignVideoPlayerProps {
  /** URL video peraga isyarat; kosong → status media tidak tersedia. */
  videoUrl?: string;
  word: string;
}

const SPEED_OPTIONS: Array<SpeedOption<SignSpeedMultiplier>> = [
  { value: 0.5, label: '0,5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1,5x' },
];

function VideoSurface({ videoUrl, word }: { videoUrl: string; word: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const speed = useSettingsStore((state) => state.signSpeed);
  const setSignSpeed = useSettingsStore((state) => state.setSignSpeed);

  const player = useVideoPlayer({ uri: videoUrl, useCaching: true }, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  // Kecepatan peraga dipakai bersama seluruh aplikasi (lihat Pengaturan), jadi
  // pilihan di layar penuh tetap berlaku setelah kembali ke tampilan inline.
  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  return (
    <>
      {/* Inline tetap memakai kontrol bawaan; tombol layar penuh native
          dimatikan agar tidak bentrok dengan kontrol kustom di bawah ini. */}
      <View style={styles.frame}>
        {!isFullscreen ? (
          <VideoView
            accessibilityLabel="Video peraga isyarat"
            allowsFullscreen={false}
            contentFit="contain"
            nativeControls
            player={player}
            style={styles.video}
          />
        ) : (
          <View style={styles.videoPlaceholderWhileFullscreen} />
        )}
        {!isFullscreen ? (
          <Pressable
            accessibilityLabel="Putar video di layar penuh"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsFullscreen(true)}
            style={styles.fullscreenButton}
          >
            <Ionicons color="#FFFFFF" name="expand-outline" size={18} />
          </Pressable>
        ) : null}
      </View>

      <FullscreenSignVideo
        onClose={() => setIsFullscreen(false)}
        onSpeedChange={setSignSpeed}
        player={player}
        speed={speed}
        visible={isFullscreen}
        word={word}
      />
    </>
  );
}

interface FullscreenSignVideoProps {
  visible: boolean;
  onClose: () => void;
  player: VideoPlayer;
  speed: SignSpeedMultiplier;
  onSpeedChange: (speed: SignSpeedMultiplier) => void;
  word: string;
}

/**
 * Lapisan layar penuh kamus. `VideoView` di dalam modal memakai instance
 * pemutar yang sama dengan tampilan inline (hanya satu yang dirender pada satu
 * waktu), sehingga posisi pemutaran tetap saat masuk dan keluar layar penuh.
 */
function FullscreenSignVideo({
  visible,
  onClose,
  player,
  speed,
  onSpeedChange,
  word,
}: FullscreenSignVideoProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  /** Kontrol tidak boleh hilang sendiri selama seek bar sedang digeser. */
  const [isScrubbing, setIsScrubbing] = useState(false);
  const controls = useAutoHideControls({ autoHide: visible && isPlaying && !isScrubbing });
  const { currentTime, duration } = useVideoProgress(player, visible && controls.visible);

  // Kontrol selalu tampil lebih dulu saat layar penuh dibuka.
  const showControls = controls.show;
  useEffect(() => {
    if (visible) {
      showControls();
    }
  }, [showControls, visible]);

  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => setIsPlaying(playing));
  useEventListener(player, 'statusChange', ({ status }) => setIsBuffering(status === 'loading'));

  const applySpeed = useCallback(
    (next: SignSpeedMultiplier) => {
      onSpeedChange(next);
      player.playbackRate = next;
      controls.show();
    },
    [controls, onSpeedChange, player]
  );

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    controls.show();
  }, [controls, player]);

  const restart = useCallback(() => {
    player.currentTime = 0;
    player.play();
    controls.show();
  }, [controls, player]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.currentTime = seconds;
      controls.show();
    },
    [controls, player]
  );

  return (
    <FullscreenVideoModal
      onRequestClose={onClose}
      onSurfacePress={controls.toggle}
      renderControls={(insets) => (
        <PlayerControlsOverlay
          currentTime={currentTime}
          duration={duration}
          insets={insets}
          isBuffering={isBuffering}
          isPlaying={isPlaying}
          onExitFullscreen={onClose}
          onRestart={restart}
          onScrubbingChange={setIsScrubbing}
          onSeekComplete={seekTo}
          onSpeedChange={applySpeed}
          onTogglePlay={togglePlay}
          speed={speed}
          speedOptions={SPEED_OPTIONS}
          title={word}
          visible={controls.visible}
        />
      )}
      visible={visible}
    >
      {visible ? (
        <VideoView
          accessibilityLabel={`Video peraga isyarat ${word}`}
          allowsFullscreen={false}
          contentFit="contain"
          nativeControls={false}
          player={player}
          pointerEvents="none"
          style={styles.fullscreenVideo}
        />
      ) : null}
    </FullscreenVideoModal>
  );
}

/** Pemutar video pembelajaran isyarat (fitur "kamus digital" dari proposal). */
export default function SignVideoPlayer({ videoUrl, word }: SignVideoPlayerProps) {
  if (!videoUrl) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.placeholderIcon}>
          <Ionicons color={colors.primary} name="videocam-outline" size={26} />
        </View>
        <Text variant="bodyStrong" align="center">
          Media peraga tidak tersedia
        </Text>
        <Text variant="caption" color="secondary" align="center" style={styles.placeholderCaption}>
          Belum ada video untuk "{word}". Gunakan pencarian alfabet atau kata lain.
        </Text>
      </View>
    );
  }

  return <VideoSurface videoUrl={videoUrl} word={word} />;
}

const styles = createSheet((colors) => ({
  frame: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.text,
  },
  video: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  videoPlaceholderWhileFullscreen: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  fullscreenButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 34,
  },
  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  placeholderIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  placeholderCaption: {
    maxWidth: 280,
  },
}));
