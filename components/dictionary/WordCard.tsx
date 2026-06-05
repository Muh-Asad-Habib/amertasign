import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';

const COLORS = {
  background: '#FFFFFF',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
};

type SignType = 'bisindo' | 'sibi';

export interface WordCardProps {
  word: string;
  category: string;
  type: SignType;
  onPress: () => void;
  imageUrl?: string;
}

export default function WordCard({
  word,
  category,
  type,
  onPress,
  imageUrl,
}: WordCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.thumbnail}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Ionicons color={COLORS.textSecondary} name="image" size={24} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.word}>{word}</Text>
        <View style={styles.badges}>
          <Badge size="sm" text={category} variant="neutral" />
          <View style={styles.badgeSpacer} />
          <Badge size="sm" text={type.toUpperCase()} variant={type === 'bisindo' ? 'primary' : 'accent'} />
        </View>
      </View>

      <Ionicons color={COLORS.textSecondary} name="chevron-forward" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 88,
    padding: 12,
  },
  thumbnail: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
    marginHorizontal: 12,
  },
  word: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeSpacer: {
    width: 8,
  },
  pressed: {
    opacity: 0.88,
  },
});
