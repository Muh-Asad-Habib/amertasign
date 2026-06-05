import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';

const COLORS = {
  primary: '#2563EB',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
};

export interface ModuleCardProps {
  title: string;
  description: string;
  level: string;
  duration: string;
  progress: number;
  thumbnailUrl?: string;
  onPress: () => void;
}

export default function ModuleCard({
  title,
  description,
  level,
  duration,
  progress,
  thumbnailUrl,
  onPress,
}: ModuleCardProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.thumbnail}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.image} />
        ) : (
          <Ionicons color={COLORS.primary} name="play-circle" size={34} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <Badge size="sm" text={level} variant="primary" />
        </View>
        <Text numberOfLines={2} style={styles.description}>
          {description}
        </Text>
        <Text style={styles.duration}>{duration}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 12,
  },
  thumbnail: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 96,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 96,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  duration: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: 999,
    height: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    height: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
});
