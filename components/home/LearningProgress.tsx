import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';

const COLORS = {
  primary: '#2563EB',
  accent: '#F59E0B',
  success: '#10B981',
  text: '#0F172A',
  textSecondary: '#64748B',
};

export interface LearningProgressProps {
  totalWords: number;
  modulesCompleted: number;
  streak: number;
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Ionicons color={iconColor} name={icon} size={24} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

export default function LearningProgress({
  totalWords,
  modulesCompleted,
  streak,
}: LearningProgressProps) {
  return (
    <View style={styles.container}>
      <StatCard icon="language" iconColor={COLORS.primary} label="Words Learned" value={totalWords} />
      <StatCard
        icon="school"
        iconColor={COLORS.accent}
        label="Modules Completed"
        value={modulesCompleted}
      />
      <StatCard icon="flame" iconColor={COLORS.success} label="Day Streak" value={streak} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  statCard: {
    alignItems: 'flex-start',
    flex: 1,
    minHeight: 130,
  },
  value: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 14,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
