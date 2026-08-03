import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';

import { colors, radius, spacing } from '../../theme';
import { useSettingsStore, type SignSpeedMultiplier } from '../../store/useSettingsStore';
import useAutoHideControls from '../../hooks/useAutoHideControls';
import useVideoProgress from '../../hooks/useVideoProgress';
import type { FullscreenPhase } from '../../hooks/useFullscreenHandoff';
import useVideoFrameRefresh, { useFrameRefreshOnHandoff } from '../../hooks/useVideoFrameRefresh';
import useFullscreenVideoLayout from '../../hooks/useFullscreenVideoLayout';
import useMediaAspect from '../../hooks/useMediaAspect';
import FullscreenVideoModal from '../player/FullscreenVideoModal';
import PlayerControlsOverlay, { type SpeedOption } from '../player/PlayerControlsOverlay';
import VideoTapArea from '../player/VideoTapArea';
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
  /** Panggung inline hanya dipasang saat modal benar-benar tertutup. */
  const [fullscreenPhase, setFullscreenPhase] = useState<FullscreenPhase>('closed');
  /** Pemutar langsung diputar saat dibuat, jadi status awalnya "berjalan". */
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const speed = useSettingsStore((state) => state.signSpeed);
  const setSignSpeed = useSettingsStore((state) => state.setSignSpeed);

  const player = useVideoPlayer({ uri: videoUrl, useCaching: true }, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => setIsPlaying(playing));
  useEventListener(player, 'statusChange', ({ status }) => setIsBuffering(status === 'loading'));

  // Kecepatan peraga dipakai bersama seluruh aplikasi (lihat Pengaturan), jadi
  // pilihan di layar penuh tetap berlaku setelah kembali ke tampilan inline.
  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  // Surface baru perlu dipaksa menggambar saat pemutar sedang dijeda, kalau
  // tidak panggung tampil hitam setelah berpindah wadah.
  const refreshFrame = useVideoFrameRefresh(player);
  useFrameRefreshOnHandoff(fullscreenPhase, refreshFrame);

  const isInline = fullscreenPhase === 'closed';

  const toggleInlinePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  return (
    <>
      {/* Kontrol bawaan dimatikan: di Android kontrol itu ikut menelan sentuhan
          sehingga ketukan pada video tidak pernah sampai ke sisi JS. Ketuk-untuk
          jeda diurus `VideoTapArea` yang ditumpuk di atas video. */}
      <View style={styles.frame}>
        {isInline ? (
          <>
            <VideoView
              accessibilityLabel="Video peraga isyarat"
              allowsFullscreen={false}
              contentFit="contain"
              importantForAccessibility="no-hide-descendants"
              nativeControls={false}
              player={player}
              pointerEvents="none"
              style={styles.video}
              surfaceType="textureView"
            />
            <VideoTapArea
              accessibilityLabel={
                isPlaying ? `Jeda peragaan ${word}` : `Putar peragaan ${word}`
              }
              onPress={toggleInlinePlay}
            />
            {isBuffering ? (
              <View pointerEvents="none" style={styles.overlay}>
                <ActivityIndicator color="#FFFFFF" size="large" />
              </View>
            ) : !isPlaying ? (
              <View pointerEvents="none" style={styles.overlay}>
                <View style={styles.overlayBubble}>
                  <Ionicons color="#FFFFFF" name="play" size={24} style={styles.overlayIcon} />
                </View>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel="Putar video di layar penuh"
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setIsFullscreen(true)}
              style={styles.fullscreenButton}
            >
              <Ionicons color="#FFFFFF" name="expand-outline" size={18} />
            </Pressable>
          </>
        ) : (
          <View style={styles.videoPlaceholderWhileFullscreen} />
        )}
      </View>

      <FullscreenSignVideo
        onClose={() => setIsFullscreen(false)}
        onPhaseChange={setFullscreenPhase}
        onSpeedChange={setSignSpeed}
        player={player}
        speed={speed}
        videoUri={videoUrl}
        visible={isFullscreen}
        word={word}
      />
    </>
  );
}

interface FullscreenSignVideoProps {
  visible: boolean;
  onClose: () => void;
  onPhaseChange: (phase: FullscreenPhase) => void;
  player: VideoPlayer;
  speed: SignSpeedMultiplier;
  onSpeedChange: (speed: SignSpeedMultiplier) => void;
  word: string;
  /** URL video aktif; dipakai membaca rasio asli media. */
  videoUri: string;
}

/**
 * Lapisan layar penuh kamus. `VideoView` di dalam modal memakai instance
 * pemutar yang sama dengan tampilan inline (hanya satu yang dirender pada satu
 * waktu), sehingga posisi pemutaran tetap saat masuk dan keluar layar penuh.
 */
function FullscreenSignVideo({
  visible,
  onClose,
  onPhaseChange,
  player,
  speed,
  onSpeedChange,
  word,
  videoUri,
}: FullscreenSignVideoProps) {
  const [isPlaying, setIsPlaying] = useState(() => player.playing);
  const [isBuffering, setIsBuffering] = useState(false);
  /** Kontrol tidak boleh hilang sendiri selama seek bar sedang digeser. */
  const [isScrubbing, setIsScrubbing] = useState(false);
  const controls = useAutoHideControls({ autoHide: visible && isPlaying && !isScrubbing });
  const { currentTime, duration } = useVideoProgress(player, visible && controls.visible);
  const mediaAspect = useMediaAspect({ player, videoUri });
  const layout = useFullscreenVideoLayout(mediaAspect);

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
      onPhaseChange={onPhaseChange}
      onRequestClose={onClose}
      onSurfacePress={controls.toggle}
      renderControls={(insets) => (
        <PlayerControlsOverlay
          currentTime={currentTime}
          duration={duration}
          insets={insets}
          isBuffering={isBuffering}
          mediaBand={layout.band}
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
      <View style={styles.fullscreenStage}>
        <View style={layout.bandStyle}>
          <VideoView
            accessibilityLabel={`Video peraga isyarat ${word}`}
            allowsFullscreen={false}
            contentFit={layout.contentFit}
            nativeControls={false}
            player={player}
            pointerEvents="none"
            style={layout.videoStyle}
            surfaceType="textureView"
          />
        </View>
      </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bulatan jeda sengaja kecil dan gelap-transparan agar tidak menutupi wajah
  // dan tangan peraga — bagian yang justru perlu dilihat.
  overlayBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  overlayIcon: {
    marginLeft: 4,
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
  fullscreenStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
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
