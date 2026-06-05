import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import DailyWord from '../../components/home/DailyWord';
import LearningProgress from '../../components/home/LearningProgress';
import QuickActions from '../../components/home/QuickActions';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import ProgressRing from '../../components/ui/ProgressRing';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { dailyWords as dailyWordIds, dictionaryEntries, learningModules } from '../../constants/MockData';

const moduleProgressMap: Record<string, number> = {
  'module-alfabet-isyarat': 0.8,
  'module-angka-isyarat': 0.55,
  'module-salam-sapaan': 0.3,
  'module-percakapan-sehari-hari': 0.15,
};

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const featuredWord = useMemo(() => {
    const dayIndex = new Date().getDay();
    const featuredIds = dailyWordIds.length > 0 ? dailyWordIds : dictionaryEntries.map((entry) => entry.id);
    const entryId = featuredIds[dayIndex % featuredIds.length];

    return (
      dictionaryEntries.find((entry) => entry.id === entryId) ??
      dictionaryEntries[dayIndex % dictionaryEntries.length]
    );
  }, []);

  const modulesToContinue = useMemo(
    () =>
      learningModules
        .slice()
        .sort((first, second) => first.order - second.order)
        .slice(0, 3),
    []
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Halo, Pengguna! 👋</Text>
            <Text style={styles.subtitle}>Ayo belajar bahasa isyarat hari ini</Text>
          </View>

          <View accessibilityLabel="Avatar pengguna" style={styles.avatar}>
            <Ionicons color={Colors.light.primary} name="person" size={22} />
          </View>
        </View>

        <View style={styles.section}>
          <QuickActions
            onDictionary={() => router.push('/(tabs)/dictionary')}
            onTranslate={() => router.push('/(tabs)/translate')}
          />
        </View>

        <View style={styles.section}>
          <LearningProgress modulesCompleted={3} streak={5} totalWords={24} />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Kata Hari Ini" />
          <DailyWord
            category={featuredWord.category}
            description={featuredWord.description}
            word={featuredWord.word}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Lanjutkan Belajar" />
          <ScrollView
            contentContainerStyle={styles.moduleList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {modulesToContinue.map((module) => {
              const progress = moduleProgressMap[module.id] ?? 0.2;

              return (
                <Card elevated key={module.id} style={styles.moduleCard}>
                  <View style={styles.moduleTopRow}>
                    <Badge text={module.level} variant="primary" size="sm" />
                    <Text style={styles.moduleDuration}>{module.duration}</Text>
                  </View>

                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text numberOfLines={2} style={styles.moduleDescription}>
                    {module.description}
                  </Text>

                  <View style={styles.moduleFooter}>
                    <View style={styles.moduleMeta}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{Math.round(progress * 100)}% selesai</Text>
                    </View>
                    <ProgressRing
                      color={Colors.light.accent}
                      progress={progress}
                      size={68}
                      strokeWidth={8}
                    />
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    paddingRight: Layout.spacing.md,
  },
  greeting: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.title,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    marginTop: Layout.spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderColor: Colors.light.primary,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  section: {
    marginTop: Layout.spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  sectionAccent: {
    backgroundColor: Colors.light.accent,
    borderRadius: Layout.radius.full,
    height: 12,
    marginRight: Layout.spacing.sm,
    width: 12,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
  },
  moduleList: {
    paddingRight: Layout.spacing.sm,
  },
  moduleCard: {
    marginRight: Layout.spacing.md,
    width: 260,
  },
  moduleTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moduleDuration: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  moduleTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    marginTop: Layout.spacing.md,
  },
  moduleDescription: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginTop: Layout.spacing.sm,
    minHeight: 40,
  },
  moduleFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.lg,
  },
  moduleMeta: {
    flex: 1,
    paddingRight: Layout.spacing.md,
  },
  progressLabel: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  progressValue: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.lg,
    fontWeight: '800',
    marginTop: Layout.spacing.xs,
  },
});
