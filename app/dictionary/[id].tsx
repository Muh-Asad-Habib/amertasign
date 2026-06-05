import React, { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import WordCard from '../../components/dictionary/WordCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDictionary } from '../../hooks/useDictionary';
import { useTTS } from '../../hooks/useTTS';
import type { DictionaryCategory } from '../../types';

const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  alfabet: 'Alfabet',
  angka: 'Angka',
  kata_umum: 'Kata Umum',
  frasa: 'Frasa',
};

export default function DictionaryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { allEntries, addToHistory, isFavorite, toggleFavorite } = useDictionary();
  const { speak } = useTTS();

  const entry = useMemo(
    () => allEntries.find((item) => item.id === entryId),
    [allEntries, entryId]
  );

  const relatedEntries = useMemo(() => {
    if (!entry) {
      return [];
    }

    return allEntries
      .filter((item) => item.category === entry.category && item.id !== entry.id)
      .slice(0, 4);
  }, [allEntries, entry]);

  useEffect(() => {
    if (entryId && entry) {
      addToHistory(entryId);
    }
  }, [addToHistory, entry, entryId]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="alert-circle-outline"
            title="Kata tidak ditemukan"
            description="Entri kamus yang kamu cari belum tersedia atau sudah dipindahkan."
            actionLabel="Kembali"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(entry.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color={Colors.light.primary} name="arrow-back" size={22} />
          <Text style={styles.backLabel}>Kembali</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <View style={styles.heroImage}>
            <Text style={styles.heroEmoji}>🤟</Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.wordTitle}>{entry.word}</Text>
          </View>

          <View style={styles.badgeRow}>
            <Badge text={entry.type.toUpperCase()} variant={entry.type === 'bisindo' ? 'primary' : 'accent'} />
            <View style={styles.badgeSpacer} />
            <Badge text={CATEGORY_LABELS[entry.category]} variant="neutral" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cara Melakukan</Text>
          <Text style={styles.description}>{entry.description}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            icon={<Ionicons color={favorite ? Colors.light.text : Colors.light.primary} name={favorite ? 'star' : 'star-outline'} size={18} />}
            onPress={() => toggleFavorite(entry.id)}
            size="sm"
            style={styles.actionButton}
            title={favorite ? 'Favorit' : '⭐ Favorit'}
            variant={favorite ? 'secondary' : 'outline'}
          />
          <Button
            icon={<Ionicons color={Colors.light.primary} name="volume-high-outline" size={18} />}
            onPress={() => speak(entry.word)}
            size="sm"
            style={styles.actionButton}
            title="🔊 Dengarkan"
            variant="outline"
          />
          <Button
            icon={<Ionicons color={Colors.light.primary} name="share-social-outline" size={18} />}
            onPress={() => Alert.alert('Bagikan', 'Fitur berbagi akan segera hadir.')}
            size="sm"
            style={styles.actionButton}
            title="📤 Bagikan"
            variant="ghost"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kata Terkait</Text>
          {relatedEntries.length > 0 ? (
            relatedEntries.map((item) => (
              <View key={item.id} style={styles.relatedItem}>
                <WordCard
                  category={CATEGORY_LABELS[item.category]}
                  imageUrl={item.imageUrl}
                  onPress={() => router.push({ pathname: '/dictionary/[id]', params: { id: item.id } })}
                  type={item.type}
                  word={item.word}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyRelatedText}>Belum ada kata terkait pada kategori ini.</Text>
          )}
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
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Layout.radius.xl,
    borderWidth: 1,
    padding: Layout.spacing.lg,
  },
  heroImage: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: Layout.radius.lg,
    height: 300,
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  heroEmoji: {
    fontSize: 88,
  },
  titleRow: {
    marginBottom: Layout.spacing.md,
  },
  wordTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.title,
    fontWeight: '800',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeSpacer: {
    width: Layout.spacing.sm,
  },
  section: {
    marginTop: Layout.spacing.xl,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    marginBottom: Layout.spacing.sm,
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 26,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Layout.spacing.xl,
  },
  actionButton: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  relatedItem: {
    marginBottom: Layout.spacing.md,
  },
  emptyRelatedText: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
  },
  pressed: {
    opacity: 0.85,
  },
});
