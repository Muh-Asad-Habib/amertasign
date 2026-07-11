import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import WordCard from '../../components/dictionary/WordCard';
import Badge from '../../components/ui/Badge';
import CategoryTabs from '../../components/ui/CategoryTabs';
import Decor from '../../components/ui/Decor';
import EmptyState from '../../components/ui/EmptyState';
import Heading from '../../components/ui/Heading';
import IconBubble from '../../components/ui/IconBubble';
import PressableScale from '../../components/ui/PressableScale';
import Row from '../../components/ui/Row';
import Screen from '../../components/ui/Screen';
import SearchBar from '../../components/ui/SearchBar';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { colors, createSheet, layoutSpacing, radius, shadow, spacing } from '../../theme';
import { useDictionary } from '../../hooks/useDictionary';
import { useThemeMode } from '../../hooks/useThemeMode';
import type { DictionaryCategory, DictionaryEntry } from '../../types';

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

/**
 * Baris virtual daftar: pencarian (sticky), filter, konten kosong, dan entri kamus.
 * Dipakai agar seluruh header ikut menggulung — hanya baris pencarian yang menempel.
 */
type ListRow =
  | { kind: 'search'; key: string }
  | { kind: 'filters'; key: string }
  | { kind: 'empty'; key: string }
  | { kind: 'entry'; key: string; entry: DictionaryEntry; index: number };

function SegmentTab({
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
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Ionicons color={active ? colors.primary : colors.textTertiary} name={icon} size={15} />
      <Text variant="label" style={{ color: active ? colors.primary : colors.textSecondary }}>
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
  // Status "menempel" baris pencarian — memberi bayangan pemisah saat digulung.
  const [searchPinned, setSearchPinned] = useState(false);
  const heroHeightRef = useRef(0);
  const pinnedRef = useRef(false);

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

  const rows = useMemo<ListRow[]>(() => {
    const header: ListRow[] = [
      { kind: 'search', key: 'search' },
      { kind: 'filters', key: 'filters' },
    ];
    if (displayedEntries.length === 0) {
      return [...header, { kind: 'empty', key: 'empty' }];
    }
    return [
      ...header,
      ...displayedEntries.map((entry, index) => ({
        kind: 'entry' as const,
        key: entry.id,
        entry,
        index,
      })),
    ];
  }, [displayedEntries]);

  const handleOpenEntry = (id: string) => {
    router.push({ pathname: '/dictionary/[id]', params: { id } });
  };


  const resetFilters = () => {
    setSearchText('');
    setActiveCategory('semua');
    setActiveLibraryTab('all');
  };

  const handleHeroLayout = (event: LayoutChangeEvent) => {
    heroHeightRef.current = event.nativeEvent.layout.height;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pinned =
      heroHeightRef.current > 0 && event.nativeEvent.contentOffset.y >= heroHeightRef.current - 2;
    if (pinned !== pinnedRef.current) {
      pinnedRef.current = pinned;
      setSearchPinned(pinned);
    }
  };

  const renderRow = ({ item }: { item: ListRow }) => {
    switch (item.kind) {
      case 'search':
        return (
          <View style={styles.searchRow}>
            <SearchBar
              onChangeText={setSearchText}
              onClear={() => setSearchText('')}
              placeholder="Cari kata atau frasa"
              value={searchText}
            />
          </View>
        );
      case 'filters':
        return (
          <View style={styles.filtersRow}>
            <CategoryTabs
              activeCategory={activeCategory}
              categories={CATEGORY_OPTIONS}
              contentPadding={layoutSpacing.screenPadding}
              onSelect={(categoryId) => setActiveCategory(categoryId as DictionaryCategory | 'semua')}
            />

            <View style={styles.padded}>
              <View style={styles.segmented}>
                {VIEW_TABS.map((tab) => (
                  <SegmentTab
                    active={activeLibraryTab === tab.id}
                    icon={tab.icon}
                    key={tab.id}
                    label={tab.label}
                    onPress={() => setActiveLibraryTab(tab.id)}
                  />
                ))}
              </View>
            </View>

            <Row align="center" justify="space-between" style={styles.padded}>
              <View style={styles.resultsCopy}>
                <Text variant="bodyStrong">{listLabel}</Text>
                <Text variant="caption" color="secondary">
                  {displayedEntries.length} hasil ditemukan
                </Text>
              </View>
              <Badge text="BISINDO" variant="primary" />
            </Row>
          </View>
        );
      case 'empty':
        return (
          <View style={styles.emptyRow}>
            <EmptyState
              actionLabel="Reset Filter"
              description={emptyDescription}
              icon="search-outline"
              onAction={resetFilters}
              title="Tidak ada hasil"
            />
          </View>
        );
      case 'entry':
        return (
          <View style={styles.entryRow}>
            <WordCard
              category={CATEGORY_LABELS[item.entry.category]}
              imageUrl={item.entry.imageUrl}
              onPress={() => handleOpenEntry(item.entry.id)}
              tint={item.index}
              type={item.entry.type}
              word={item.entry.word}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Screen padded={false}>
      <Decor preset="header" />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={rows}
        extraData={[searchText, activeCategory, activeLibraryTab, searchPinned]}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <View onLayout={handleHeroLayout} style={styles.hero}>
            <Row align="flex-start" gap={spacing.md} justify="space-between">
              <View style={styles.heroCopy}>
                <Text variant="kicker" color="primary">
                  Kamus
                </Text>
                <Heading variant="title">Kamus Isyarat</Heading>
                <Squiggle width={92} height={12} />
              </View>
              <IconBubble circle name="book" size="md" tone="accent" />
            </Row>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Cari kata isyarat BISINDO dengan cepat.
            </Text>
          </View>
        }
        onScroll={handleScroll}
        renderItem={renderRow}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/*
        Search bar "menempel" versi overlay statis: menggantikan stickyHeaderIndices
        yang area sentuhnya rusak saat sel ditransformasi (bug Android). Selalu
        ter-mount agar fokus keyboard tidak hilang; disembunyikan saat belum pinned.
      */}
      <View
        accessibilityElementsHidden={!searchPinned}
        importantForAccessibility={searchPinned ? 'auto' : 'no-hide-descendants'}
        pointerEvents={searchPinned ? 'auto' : 'none'}
        style={[styles.pinnedSearch, !searchPinned && styles.pinnedSearchHidden]}
      >
        <SearchBar
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
          placeholder="Cari kata atau frasa"
          value={searchText}
        />
      </View>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: layoutSpacing.tabBarClearance,
  },
  hero: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: layoutSpacing.screenPadding,
    paddingTop: spacing.base,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  // Baris pencarian di dalam daftar — ikut menggulung bersama konten.
  searchRow: {
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
    paddingHorizontal: layoutSpacing.screenPadding,
    paddingTop: spacing.sm,
  },
  // Overlay pencarian pinned — tampil saat baris search asli lewat batas atas.
  pinnedSearch: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    left: 0,
    paddingBottom: spacing.md,
    paddingHorizontal: layoutSpacing.screenPadding,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    ...shadow.sm,
  },
  pinnedSearchHidden: {
    opacity: 0,
  },
  filtersRow: {
    gap: spacing.md,
    paddingBottom: spacing.base,
  },
  padded: {
    paddingHorizontal: layoutSpacing.screenPadding,
  },
  // Kontrol segmen ala pill — Semua / Favorit / Riwayat.
  segmented: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  resultsCopy: {
    gap: 2,
  },
  entryRow: {
    marginBottom: spacing.md,
    paddingHorizontal: layoutSpacing.screenPadding,
  },
  emptyRow: {
    paddingHorizontal: layoutSpacing.screenPadding,
    paddingVertical: spacing.xl,
  },
}));
