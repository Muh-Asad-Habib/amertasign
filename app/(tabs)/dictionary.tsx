import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import WordCard from '../../components/dictionary/WordCard';
import CategoryTabs from '../../components/ui/CategoryTabs';
import EmptyState from '../../components/ui/EmptyState';
import SearchBar from '../../components/ui/SearchBar';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useDictionary } from '../../hooks/useDictionary';
import type { DictionaryCategory, SignLanguageType } from '../../types';

const CATEGORY_OPTIONS: Array<{ id: DictionaryCategory | 'semua'; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'alfabet', label: 'Alfabet' },
  { id: 'angka', label: 'Angka' },
  { id: 'kata_umum', label: 'Kata Umum' },
  { id: 'frasa', label: 'Frasa' },
];

const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  alfabet: 'Alfabet',
  angka: 'Angka',
  kata_umum: 'Kata Umum',
  frasa: 'Frasa',
};

type LibraryTab = 'all' | 'favorites' | 'history';

const SIGN_LANGUAGE_OPTIONS: Array<{ id: SignLanguageType; label: string }> = [
  { id: 'bisindo', label: 'BISINDO' },
  { id: 'sibi', label: 'SIBI' },
];

export default function DictionaryScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<DictionaryCategory | 'semua'>('semua');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const {
    filteredEntries,
    favoriteEntries,
    historyEntries,
    signLanguageFilter,
    setSignLanguageFilter,
  } = useDictionary({ category: activeCategory, search: searchText });

  const displayedEntries =
    activeLibraryTab === 'favorites'
      ? favoriteEntries
      : activeLibraryTab === 'history'
        ? historyEntries
        : filteredEntries;

  const listLabel =
    activeLibraryTab === 'favorites'
      ? 'Kata favorit'
      : activeLibraryTab === 'history'
        ? 'Riwayat dilihat'
        : 'Semua hasil';

  const emptyDescription =
    activeLibraryTab === 'favorites'
      ? 'Simpan kata favorit dulu, lalu buka lagi tab ini untuk akses cepat.'
      : activeLibraryTab === 'history'
        ? 'Buka detail kata untuk mulai membangun riwayat pencarianmu.'
        : 'Coba ubah kata kunci, kategori, atau jenis bahasa isyarat.';

  const handleOpenEntry = (id: string) => {
    router.push({ pathname: '/dictionary/[id]', params: { id } });
  };

  const handleLibraryTabPress = (tab: Exclude<LibraryTab, 'all'>) => {
    setActiveLibraryTab((currentTab) => (currentTab === tab ? 'all' : tab));
  };

  const resetFilters = () => {
    setSearchText('');
    setActiveCategory('semua');
    setActiveLibraryTab('all');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kamus Isyarat</Text>
          <Text style={styles.subtitle}>Cari kata BISINDO dan SIBI dengan cepat.</Text>
        </View>

        <View style={styles.typeToggleRow}>
          {SIGN_LANGUAGE_OPTIONS.map((option) => {
            const active = option.id === signLanguageFilter;

            return (
              <Pressable
                key={option.id}
                onPress={() => setSignLanguageFilter(option.id)}
                style={({ pressed }) => [
                  styles.typeToggle,
                  active ? styles.typeToggleActive : styles.typeToggleInactive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.typeToggleLabel, active && styles.typeToggleLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SearchBar
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
          placeholder="Cari kata atau frasa"
          value={searchText}
        />

        <View style={styles.categoryTabsWrapper}>
          <CategoryTabs
            activeCategory={activeCategory}
            categories={CATEGORY_OPTIONS}
            onSelect={(categoryId) => setActiveCategory(categoryId as DictionaryCategory | 'semua')}
          />
        </View>

        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsLabel}>{listLabel}</Text>
            <Text style={styles.resultsCount}>{displayedEntries.length} hasil ditemukan</Text>
          </View>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeText}>{signLanguageFilter.toUpperCase()}</Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            displayedEntries.length === 0 && styles.emptyListContent,
          ]}
          data={displayedEntries}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              actionLabel="Reset Filter"
              description={emptyDescription}
              icon="search-outline"
              onAction={resetFilters}
              title="Tidak ada hasil"
            />
          }
          renderItem={({ item }) => (
            <WordCard
              category={CATEGORY_LABELS[item.category]}
              imageUrl={item.imageUrl}
              onPress={() => handleOpenEntry(item.id)}
              type={item.type}
              word={item.word}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />

        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarHint}>Ketuk lagi tab aktif untuk kembali ke semua hasil.</Text>
          <View style={styles.bottomTabsRow}>
            <Pressable
              onPress={() => handleLibraryTabPress('favorites')}
              style={({ pressed }) => [
                styles.bottomTab,
                activeLibraryTab === 'favorites' && styles.bottomTabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.bottomTabLabel,
                  activeLibraryTab === 'favorites' && styles.bottomTabLabelActive,
                ]}
              >
                Favorit ⭐
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleLibraryTabPress('history')}
              style={({ pressed }) => [
                styles.bottomTab,
                activeLibraryTab === 'history' && styles.bottomTabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.bottomTabLabel,
                  activeLibraryTab === 'history' && styles.bottomTabLabelActive,
                ]}
              >
                Riwayat 🕐
              </Text>
            </Pressable>
          </View>
        </View>
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
    lineHeight: 24,
    marginTop: Layout.spacing.xs,
  },
  typeToggleRow: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  typeToggle: {
    borderRadius: Layout.radius.full,
    flex: 1,
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  typeToggleActive: {
    backgroundColor: Colors.light.primary,
  },
  typeToggleInactive: {
    backgroundColor: '#DBEAFE',
    borderColor: Colors.light.border,
    borderWidth: 1,
  },
  typeToggleLabel: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  typeToggleLabelActive: {
    color: Colors.light.surface,
  },
  categoryTabsWrapper: {
    marginTop: Layout.spacing.md,
  },
  resultsHeader: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: Layout.radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  resultsLabel: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.body,
    fontWeight: '800',
  },
  resultsCount: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    marginTop: 2,
  },
  resultsBadge: {
    backgroundColor: Colors.light.surface,
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  resultsBadgeText: {
    color: Colors.light.accent,
    fontSize: Layout.fontSize.xs,
    fontWeight: '800',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Layout.spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: Layout.spacing.md,
  },
  bottomBar: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    paddingBottom: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
  },
  bottomBarHint: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.xs,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  bottomTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomTab: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
    minHeight: 40,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  bottomTabActive: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.light.accent,
  },
  bottomTabLabel: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  bottomTabLabelActive: {
    color: Colors.light.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
