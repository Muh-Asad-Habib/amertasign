import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  accent: '#F59E0B',
  darkText: '#0F172A',
  white: '#FFFFFF',
};

export interface QuickActionsProps {
  onTranslate: () => void;
  onDictionary: () => void;
}

function ActionCard({
  title,
  subtitle,
  icon,
  backgroundColor,
  textColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons color={textColor} name={icon} size={30} />
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>
    </Pressable>
  );
}

export default function QuickActions({ onTranslate, onDictionary }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <ActionCard
        backgroundColor={COLORS.primary}
        icon="camera"
        onPress={onTranslate}
        subtitle="Deteksi bahasa isyarat langsung"
        textColor={COLORS.white}
        title="Mulai Terjemah"
      />
      <ActionCard
        backgroundColor={COLORS.accent}
        icon="book"
        onPress={onDictionary}
        subtitle="Pelajari kosakata isyarat"
        textColor={COLORS.darkText}
        title="Buka Kamus"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 16,
    flex: 1,
    minHeight: 148,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.88,
  },
});
