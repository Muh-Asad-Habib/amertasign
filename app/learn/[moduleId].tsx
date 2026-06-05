import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import VideoPlayer from '../../components/learn/VideoPlayer';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useLearning } from '../../hooks/useLearning';
import type { LearningLevel } from '../../types';

const LEVEL_LABELS: Record<LearningLevel, string> = {
  pemula: 'Pemula',
  menengah: 'Menengah',
  lanjutan: 'Lanjutan',
};

const LEVEL_VARIANTS: Record<LearningLevel, 'primary' | 'accent' | 'success'> = {
  pemula: 'primary',
  menengah: 'accent',
  lanjutan: 'success',
};

export default function LearnModuleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId?: string | string[] }>();
  const moduleId = Array.isArray(params.moduleId) ? params.moduleId[0] : params.moduleId;
  const { allModules, completeModule, isCompleted } = useLearning();

  const module = useMemo(
    () => allModules.find((item) => item.id === moduleId),
    [allModules, moduleId]
  );

  const siblingModules = useMemo(() => {
    if (!module) {
      return [];
    }

    return allModules
      .filter((item) => item.level === module.level)
      .sort((first, second) => first.order - second.order);
  }, [allModules, module]);

  const currentIndex = siblingModules.findIndex((item) => item.id === module?.id);
  const previousModule = currentIndex > 0 ? siblingModules[currentIndex - 1] : undefined;
  const nextModule = currentIndex >= 0 ? siblingModules[currentIndex + 1] : undefined;

  if (!module) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="school-outline"
            title="Modul tidak ditemukan"
            description="Modul belajar yang kamu cari belum tersedia atau sudah dipindahkan."
            actionLabel="Kembali"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const completed = isCompleted(module.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color={Colors.light.primary} name="arrow-back" size={22} />
          <Text style={styles.backLabel}>Kembali</Text>
        </Pressable>

        <VideoPlayer
          description={module.description}
          onComplete={() => completeModule(module.id)}
          showAction={false}
          showDetails={false}
          title={module.title}
          videoUrl={module.videoUrl}
        />

        <View style={styles.headerSection}>
          <Text style={styles.title}>{module.title}</Text>
          <View style={styles.metaRow}>
            <Badge text={LEVEL_LABELS[module.level]} variant={LEVEL_VARIANTS[module.level]} />
            <Text style={styles.duration}>{module.duration}</Text>
          </View>
          <Text style={styles.description}>{module.description}</Text>
        </View>

        <Button
          fullWidth
          icon={<Ionicons color="#FFFFFF" name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} />}
          onPress={() => completeModule(module.id)}
          style={styles.completeButton}
          title={completed ? 'Selesai ✅' : 'Tandai Selesai ✅'}
          variant={completed ? 'secondary' : 'primary'}
        />

        <View style={styles.navigationRow}>
          <Button
            disabled={!previousModule}
            icon={<Ionicons color={previousModule ? Colors.light.primary : Colors.light.textSecondary} name="arrow-back-outline" size={18} />}
            onPress={() => previousModule && router.push({ pathname: '/learn/[moduleId]', params: { moduleId: previousModule.id } })}
            size="sm"
            style={styles.navButton}
            title="Sebelumnya"
            variant="outline"
          />
          <Button
            disabled={!nextModule}
            icon={<Ionicons color={nextModule ? '#FFFFFF' : Colors.light.textSecondary} name="arrow-forward-outline" size={18} />}
            onPress={() => nextModule && router.push({ pathname: '/learn/[moduleId]', params: { moduleId: nextModule.id } })}
            size="sm"
            style={styles.navButton}
            title="Berikutnya"
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: Layout.radius.full,
    flexDirection: 'row',
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  backLabel: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    marginLeft: Layout.spacing.xs,
  },
  headerSection: {
    marginTop: Layout.spacing.xl,
  },
  title: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xxl,
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Layout.spacing.md,
  },
  duration: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    fontWeight: '700',
    marginLeft: Layout.spacing.md,
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 26,
    marginTop: Layout.spacing.md,
  },
  completeButton: {
    marginTop: Layout.spacing.xl,
  },
  navigationRow: {
    flexDirection: 'row',
    marginTop: Layout.spacing.lg,
  },
  navButton: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
