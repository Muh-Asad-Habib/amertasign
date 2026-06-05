import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const COLORS = {
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  text: '#0F172A',
  textSecondary: '#64748B',
};

export interface DailyWordProps {
  word: string;
  description: string;
  category: string;
}

export default function DailyWord({ word, description, category }: DailyWordProps) {
  return (
    <Card elevated style={styles.card}>
      <View style={styles.header}>
        <View style={styles.accentPill} />
        <Text style={styles.eyebrow}>Kata Hari Ini</Text>
      </View>
      <Badge size="sm" text={category} variant="accent" />
      <Text style={styles.word}>{word}</Text>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 6,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  accentPill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    height: 10,
    marginRight: 8,
    width: 32,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  word: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
});
