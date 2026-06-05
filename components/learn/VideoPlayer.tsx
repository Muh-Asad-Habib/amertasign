import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import Card from '../ui/Card';

const COLORS = {
  primary: '#2563EB',
  surface: '#E0F2FE',
  text: '#0F172A',
  textSecondary: '#64748B',
};

export interface VideoPlayerProps {
  title: string;
  description: string;
  videoUrl: string;
  onComplete: () => void;
  showDetails?: boolean;
  showAction?: boolean;
  actionLabel?: string;
}

export default function VideoPlayer({
  title,
  description,
  videoUrl,
  onComplete,
  showDetails = true,
  showAction = true,
  actionLabel = 'Tandai Selesai',
}: VideoPlayerProps) {
  return (
    <Card elevated>
      <Pressable style={({ pressed }) => [styles.preview, pressed && styles.pressed]}>
        <View style={styles.playButton}>
          <Ionicons color="#FFFFFF" name="play" size={28} />
        </View>
        <Text numberOfLines={1} style={styles.previewLabel}>
          {videoUrl ? 'Video siap diputar' : 'Video belum tersedia'}
        </Text>
      </Pressable>

      {showDetails ? <Text style={styles.title}>{title}</Text> : null}
      {showDetails ? <Text style={styles.description}>{description}</Text> : null}
      {showAction ? (
        <View style={styles.actionContainer}>
          <Button fullWidth onPress={onComplete} title={actionLabel} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  previewLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  actionContainer: {
    marginTop: 20,
  },
  pressed: {
    opacity: 0.88,
  },
});
