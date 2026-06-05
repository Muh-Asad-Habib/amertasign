import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ModuleCard from '../../components/learn/ModuleCard';
import Card from '../../components/ui/Card';
import CategoryTabs from '../../components/ui/CategoryTabs';
import EmptyState from '../../components/ui/EmptyState';
import ProgressRing from '../../components/ui/ProgressRing';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useLearning, type LearningLevelFilter } from '../../hooks/useLearning';
import type { LearningLevel } from '../../types';

const LEVEL_OPTIONS: Array<{ id: LearningLevelFilter; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'pemula', label: 'Pemula' },
  { id: 'menengah', label: 'Menengah' },
  { id: 'lanjutan', label: 'Lanjutan' },
];

const LEVEL_LABELS: Record<LearningLevel, string> = {
  pemula: 'Pemula',
  menengah: 'Menengah',
  lanjutan: 'Lanjutan',
};

export default function LearnScreen() {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState<LearningLevelFilter>('semua');
  const { completionStats, filteredModules } = useLearning(activeLevel);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Belajar Isyarat</Text>
          <Text style={styles.subtitle}>Pilih level dan mulai belajar</Text>
        </View>

        <Card elevated style={styles.progressCard}>
          <View style={styles.progressContent}>
            <View style={styles.progressTextContent}>
              <Text style={styles.progressEyebrow}>Progress Belajar</Text>
              <Text style={styles.progressTitle}>
                {completionStats.completed}/{completionStats.total} modul selesai
              </Text>
              <Text style={styles.progressDescription}>
                Lanjutkan modul favoritmu dan capai {Math.round(completionStats.percentage * 100)}% target mingguan.
              </Text>
            </View>
            <ProgressRing color={Colors.light.accent} progress={completionStats.percentage} size={88} />
          </View>
        </Card>

        <View style={styles.levelTabsWrapper}>
          <CategoryTabs
            activeCategory={activeLevel}
            categories={LEVEL_OPTIONS}
            onSelect={(level) => setActiveLevel(level as LearningLevelFilter)}
          />
        </View>

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            filteredModules.length === 0 && styles.emptyListContent,
          ]}
          data={filteredModules}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              description="Belum ada modul untuk level ini. Coba pilih level lain."
              icon="school-outline"
              title="Modul belum tersedia"
            />
          }
          renderItem={({ item }) => (
            <ModuleCard
              description={item.description}
              duration={item.duration}
              level={LEVEL_LABELS[item.level]}
              onPress={() =>
                router.push({ pathname: '/learn/[moduleId]', params: { moduleId: item.id } })
              }
              progress={item.progress}
              thumbnailUrl={item.thumbnailUrl}
              title={item.title}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    marginBottom: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
  },
  title: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.title,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    marginTop: Layout.spacing.xs,
  },
  progressCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    marginBottom: Layout.spacing.lg,
  },
  progressContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTextContent: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  progressEyebrow: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  progressTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    marginTop: Layout.spacing.xs,
  },
  progressDescription: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginTop: Layout.spacing.sm,
  },
  levelTabsWrapper: {
    marginBottom: Layout.spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Layout.spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: Layout.spacing.md,
  },
});
