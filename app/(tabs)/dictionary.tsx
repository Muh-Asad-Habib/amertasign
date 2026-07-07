import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import WordCard from '../../components/dictionary/WordCard';
import Badge from '../../components/ui/Badge';
import CategoryTabs from '../../components/ui/CategoryTabs';
import Decor from '../../components/ui/Decor';
import EmptyState from '../../components/ui/EmptyState';
import Heading from '../../components/ui/Heading';
import PressableScale from '../../components/ui/PressableScale';
import Row from '../../components/ui/Row';
import Screen from '../../components/ui/Screen';
import SearchBar from '../../components/ui/SearchBar';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { colors, radius, spacing } from '../../theme';
import { useDictionary } from '../../hooks/useDictionary';
import { useThemeMode } from '../../hooks/useThemeMode';
import type { DictionaryCategory } from '../../types';

import { createSheet } from '../../theme';

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

const VIEW_TABS: Array<{ id: LibraryTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { id: 'all', label: 'Semua', icon: 'albums-outline' },
  { id: 'favorites', label: 'Favorit', icon: 'star' },
  { id: 'history', label: 'Riwayat', icon: 'time-outline' },
];

function ViewChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const tint = active ? colors.textOnPrimary : colors.textSecondary;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Ionicons color={tint} name={icon} size={15} />
      <Text variant="label" style={{ color: tint }}>
        {label}
      </Text>
    </PressableScale>
  );
}

export default function DictionaryScreen() {
  useThemeMode();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<DictionaryCategory | 'semua'>('semua');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const { filteredEntries, favoriteEntries, historyEntries } = useDictionary({
    category: activeCategory,
    search: searchText,
  });

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
        : 'Coba ubah kata kunci atau kategori.';

  const handleOpenEntry = (id: string) => {
    router.push({ pathname: '/dictionary/[id]', params: { id } });
  };

  const resetFilters = () => {
    setSearchText('');
    setActiveCategory('semua');
    setActiveLibraryTab('all');
  };

  return (
    <Screen>
      <Decor preset="header" />

      <View style={styles.header}>
        <Text variant="kicker" color="primary">
          Kamus
        </Text>
        <Heading variant="hero">Kamus Isyarat</Heading>
        <Squiggle width={92} height={12} />
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Cari kata isyarat BISINDO dengan cepat.
        </Text>
      </View>

      <View style={styles.filters}>
        <SearchBar
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
          placeholder="Cari kata atau frasa"
          value={searchText}
        />

        <CategoryTabs
          activeCategory={activeCategory}
          categories={CATEGORY_OPTIONS}
          onSelect={(categoryId) => setActiveCategory(categoryId as DictionaryCategory | 'semua')}
        />

        <Row gap={spacing.sm}>
          {VIEW_TABS.map((tab) => (
            <ViewChip
              active={activeLibraryTab === tab.id}
              icon={tab.icon}
              key={tab.id}
              label={tab.label}
              onPress={() => setActiveLibraryTab(tab.id)}
            />
          ))}
        </Row>

        <Row justify="space-between" align="center">
          <View style={styles.resultsCopy}>
            <Text variant="bodyStrong">{listLabel}</Text>
            <Text variant="caption" color="secondary">
              {displayedEntries.length} hasil ditemukan
            </Text>
          </View>
          <Badge text="BISINDO" variant="primary" />
        </Row>
      </View>

      <FlatList
        contentContainerStyle={[styles.listContent, displayedEntries.length === 0 && styles.emptyListContent]}
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
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  header: {
    gap: 6,
    marginBottom: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  filters: {
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  resultsCopy: {
    gap: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: spacing.md,
  },
}));
