import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, type VideoPlayer } from 'expo-video';

import type { TextToSignUnit } from '../../services/translation';
import { colors, radius, spacing } from '../../theme';
import useFullscreenVideoLayout from '../../hooks/useFullscreenVideoLayout';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface SignSequenceStageProps {
  unit?: TextToSignUnit;
  /** Pemutar milik `useSignSequenceVideo`; panggung hanya menampilkannya. */
  player: VideoPlayer;
  /** URL video gerakan aktif; null → tampilkan gambar / status kosong. */
  videoUri: string | null;
  isBuffering: boolean;
  /** Rangkaian sedang berjalan (auto-play). */
  isPlaying: boolean;
  /** Tap pada panggung inline → jeda / lanjut. Tidak dipakai di layar penuh. */
  onPress: () => void;
  /** Tombol masuk layar penuh; disembunyikan bila tidak diberikan. */
  onRequestFullscreen?: () => void;
  /**
   * `inline` = kartu 4:3 di dalam layar terjemahan.
   * `fullscreen` = memenuhi layar tanpa overlay bawaan (kontrol diurus terpisah).
   */
  variant?: 'inline' | 'fullscreen';
  /** Rasio lebar/tinggi video peraga; dipakai menata pita video layar penuh. */
  videoAspect?: number;
}

/**
 * Panggung peraga isyarat: menampilkan video / gambar gerakan yang sedang
 * aktif. Komponen ini murni tampilan supaya bisa dipindah ke modal layar penuh
 * tanpa membuat ulang instance pemutar.
 */
export default function SignSequenceStage({
  unit,
  player,
  videoUri,
  isBuffering,
  isPlaying,
  onPress,
  onRequestFullscreen,
  variant = 'inline',
  videoAspect,
}: SignSequenceStageProps) {
  const isFullscreen = variant === 'fullscreen';
  const layout = useFullscreenVideoLayout(videoAspect);

  const media = videoUri ? (
    <VideoView
      accessibilityLabel={`Peragaan isyarat ${unit?.word ?? ''}`}
      allowsFullscreen={false}
      contentFit={isFullscreen ? layout.contentFit : 'contain'}
      nativeControls={false}
      player={player}
      pointerEvents="none"
      style={styles.media}
      // TextureView bertahan jauh lebih baik saat pemutar dipindah antara
      // panggung inline dan layar penuh; SurfaceView sering tampil hitam
      // karena frame terakhir tidak digambar ulang pada surface baru.
      surfaceType="textureView"
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
  );

  // Di layar penuh seluruh sentuhan & indikator ditangani lapisan kontrol milik
  // modal, jadi panggung sengaja dibuat pasif (tanpa Pressable) supaya tidak
  // ada dua penerima tap untuk satu sentuhan.
  if (isFullscreen) {
    return (
      <View style={styles.stageFullscreen}>
        <View style={layout.bandStyle}>{media}</View>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Jeda peragaan' : 'Putar peragaan'}
        accessibilityState={{ selected: isPlaying }}
        onPress={onPress}
        scaleTo={0.995}
        style={styles.stageSurface}
      >
        {media}

        {isBuffering ? (
          <View pointerEvents="none" style={styles.overlay}>
            <ActivityIndicator color={colors.textOnPrimary} size="large" />
          </View>
        ) : !isPlaying ? (
          <View pointerEvents="none" style={styles.overlay}>
            <View style={styles.overlayBubble}>
              <Ionicons color="#FFFFFF" name="play" size={24} style={styles.overlayIcon} />
            </View>
          </View>
        ) : null}
      </PressableScale>

      {/* Sengaja saudara, bukan anak, dari permukaan tap di atas: Pressable
          bersarang membuat tap tombol ini kadang tertangkap panggung. */}
      {onRequestFullscreen ? (
        <PressableScale
          accessibilityLabel="Tampilkan peragaan di layar penuh"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onRequestFullscreen}
          style={styles.fullscreenButton}
        >
          <Ionicons color="#FFFFFF" name="expand-outline" size={18} />
        </PressableScale>
      ) : null}
    </View>
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
  stageSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  stageFullscreen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
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
  // Bulatan jeda sengaja kecil dan gelap-transparan: versi putih 64 px yang
  // lama menutupi wajah dan tangan peraga, justru bagian yang perlu dilihat.
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
}));
