import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

import { colors, radius, spacing } from '../../theme';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

export interface SignVideoPlayerProps {
  /** URL video peraga isyarat; kosong → placeholder "segera tersedia". */
  videoUrl?: string;
  word: string;
}

function VideoSurface({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
  });

  return (
    <VideoView
      accessibilityLabel="Video peraga isyarat"
      allowsFullscreen
      contentFit="contain"
      nativeControls
      player={player}
      style={styles.video}
    />
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
          Video peraga segera tersedia
        </Text>
        <Text variant="caption" color="secondary" align="center" style={styles.placeholderCaption}>
          Video tutorial gerakan "{word}" sedang disiapkan oleh tim Amerta Sign.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <VideoSurface videoUrl={videoUrl} />
    </View>
  );
}

const styles = createSheet((colors) => ({
  frame: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.text,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
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
