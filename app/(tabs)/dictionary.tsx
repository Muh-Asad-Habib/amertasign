import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
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
import { WordCardSkeleton } from '../../components/ui/Skeleton';
import { colors, createSheet, layoutSpacing, radius, shadow, spacing, touchTargetMin } from '../../theme';
import { useDictionary } from '../../hooks/useDictionary';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useKeyboardWindowOverlap } from '../../hooks/useKeyboardOverlap';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useSettingsStore } from '../../store/useSettingsStore';
import { avatarMediaUrl } from '../../utils/avatarMediaUrl';
import type { DictionaryCategory, DictionaryEntry } from '../../types';
import { CATEGORY_LABELS as SHARED_CATEGORY_LABELS } from '../../constants/Dictionary';

const CATEGORY_OPTIONS: Array<{ id: DictionaryCategory | 'semua'; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'alfabet', label: 'Alfabet' },
  { id: 'angka', label: 'Angka' },
  { id: 'kata_umum', label: 'Kata Umum' },
  { id: 'frasa', label: 'Frasa' },
];

const CATEGORY_LABELS = SHARED_CATEGORY_LABELS;

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
  | { kind: 'offline'; key: string }
  | { kind: 'skeleton'; key: string }
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
  // Filter dihitung setelah pengguna berhenti mengetik — hemat render list besar.
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const [activeCategory, setActiveCategory] = useState<DictionaryCategory | 'semua'>('semua');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Sisakan ruang bawah agar hasil terakhir tidak tertutup keyboard. Konten
  // membentang sampai tepi window (Screen memakai edge 'top' saja).
  const keyboardOverlap = useKeyboardWindowOverlap();
  // Status "menempel" baris pencarian — memberi bayangan pemisah saat digulung.
  const [searchPinned, setSearchPinned] = useState(false);
  const heroHeightRef = useRef(0);
  const pinnedRef = useRef(false);
  // Thumbnail daftar mengikuti karakter peraga terpilih (lihat utils/avatarMediaUrl).
  const avatarGender = useSettingsStore((state) => state.avatarGender);

  const { filteredEntries, favoriteEntries, historyEntries, isLoadingEntries, isOffline, refresh } =
    useDictionary({
      category: activeCategory,
      search: debouncedSearch,
    });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

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

  const hasSearchQuery = searchText.trim().length > 0;

  const resetFilters = () => {
    setSearchText('');
    setActiveCategory('semua');
    setActiveLibraryTab('all');
  };

  /** Pesan kosong dibedakan per tab agar pengguna tahu langkah berikutnya. */
  const emptyState =
    activeLibraryTab === 'favorites'
      ? {
          icon: 'star-outline' as const,
          title: 'Belum ada favorit',
          description: 'Ketuk ikon bintang pada detail kata untuk menyimpannya di sini.',
          actionLabel: 'Jelajahi Kamus',
          onAction: () => setActiveLibraryTab('all'),
        }
      : activeLibraryTab === 'history'
        ? {
            icon: 'time-outline' as const,
            title: 'Riwayat masih kosong',
            description: 'Kata yang Anda buka akan muncul di sini agar mudah dilihat kembali.',
            actionLabel: 'Jelajahi Kamus',
            onAction: () => setActiveLibraryTab('all'),
          }
        : hasSearchQuery || activeCategory !== 'semua'
          ? {
              icon: 'search-outline' as const,
              title: 'Tidak ada hasil',
              description: 'Coba ubah kata kunci atau pilih kategori lain.',
              actionLabel: 'Reset Filter',
              onAction: resetFilters,
            }
          : {
              icon: 'cloud-offline-outline' as const,
              title: 'Kamus belum tersedia',
              description: 'Data kamus belum bisa dimuat. Periksa koneksi lalu muat ulang.',
              actionLabel: 'Muat Ulang',
              onAction: () => void refresh(),
            };

  const rows = useMemo<ListRow[]>(() => {
    const header: ListRow[] = [
      { kind: 'search', key: 'search' },
      { kind: 'filters', key: 'filters' },
    ];
    if (isOffline) {
      header.push({ kind: 'offline', key: 'offline' });
    }
    if (isLoadingEntries) {
      return [
        ...header,
        ...Array.from({ length: 5 }, (_, index) => ({
          kind: 'skeleton' as const,
          key: `skeleton-${index}`,
        })),
      ];
    }
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
  }, [displayedEntries, isLoadingEntries, isOffline]);

  const handleOpenEntry = (id: string) => {
    router.push({ pathname: '/dictionary/[id]', params: { id } });
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
      case 'offline':
        return (
          <View style={styles.padded}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Muat ulang kamus"
              accessibilityHint="Menampilkan data contoh karena server belum terjangkau"
              onPress={() => void refresh()}
              style={styles.offlineBanner}
            >
              <Ionicons color={colors.warning} name="cloud-offline-outline" size={18} />
              <View style={styles.offlineCopy}>
                <Text variant="label" color="secondary">
                  Mode offline — menampilkan data contoh
                </Text>
                <Text variant="caption" color="tertiary">
                  Ketuk untuk mencoba memuat ulang
                </Text>
              </View>
            </PressableScale>
          </View>
        );
      case 'skeleton':
        return (
          <View style={styles.entryRow}>
            <WordCardSkeleton />
          </View>
        );
      case 'empty':
        return (
          <View style={styles.emptyRow}>
            <EmptyState
              actionLabel={emptyState.actionLabel}
              description={emptyState.description}
              icon={emptyState.icon}
              onAction={emptyState.onAction}
              title={emptyState.title}
            />
          </View>
        );
      case 'entry':
        return (
          <View style={styles.entryRow}>
            <WordCard
              category={CATEGORY_LABELS[item.entry.category]}
              fallbackImageUrl={item.entry.imageUrl}
              imageUrl={avatarMediaUrl(item.entry.imageUrl, avatarGender)}
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
        contentContainerStyle={[
          styles.listContent,
          keyboardOverlap > 0 && { paddingBottom: layoutSpacing.tabBarClearance + keyboardOverlap },
        ]}
        data={rows}
        extraData={[searchText, activeCategory, activeLibraryTab, searchPinned]}
        keyboardDismissMode="on-drag"
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
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={isRefreshing}
            tintColor={colors.primary}
            onRefresh={() => void handleRefresh()}
          />
        }
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
  offlineBanner: {
    alignItems: 'center',
    backgroundColor: colors.warningTint,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offlineCopy: {
    flex: 1,
    gap: 2,
  },
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
    minHeight: touchTargetMin,
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
