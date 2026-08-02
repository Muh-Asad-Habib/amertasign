import React, { useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import BackHeader from '../components/ui/BackHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import PressableScale from '../components/ui/PressableScale';
import Screen from '../components/ui/Screen';
import SearchBar from '../components/ui/SearchBar';
import Snackbar from '../components/ui/Snackbar';
import Text from '../components/ui/Text';
import { colors, radius, shadow, spacing } from '../theme';
import { useKeyboardWindowOverlap } from '../hooks/useKeyboardOverlap';
import { useTTS } from '../hooks/useTTS';
import { useThemeMode } from '../hooks/useThemeMode';
import { useAuthStore } from '../store/useAuthStore';
import { useHistoryStore, CLEAR_HISTORY_UNDO_MS, type TranslationHistoryItem } from '../store/useHistoryStore';
import { formatDayGroupLabel, formatTime } from '../utils/datetime';

import { createSheet } from '../theme';

const EMPTY_HISTORY: TranslationHistoryItem[] = [];

const KIND_LABELS = {
  'isyarat-ke-teks': 'Isyarat ke Teks',
  'teks-ke-isyarat': 'Teks ke Isyarat',
} as const;



function HistoryRow({ item, onSpeak }: { item: TranslationHistoryItem; onSpeak: (text: string) => void }) {
  const isSignToText = item.kind === 'isyarat-ke-teks';

  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, isSignToText ? styles.itemIconPrimary : styles.itemIconAccent]}>
        <Ionicons
          color={isSignToText ? colors.primary : colors.accentStrong}
          name={isSignToText ? 'hand-left-outline' : 'chatbubble-ellipses-outline'}
          size={20}
        />
      </View>
      <View style={styles.itemCopy}>
        <View style={styles.itemMeta}>
          <Badge size="sm" text={KIND_LABELS[item.kind]} variant={isSignToText ? 'primary' : 'accent'} />
          <Text variant="label" color="tertiary">
            {formatTime(item.createdAt)}
          </Text>
        </View>
        <Text variant="bodyStrong" numberOfLines={2} style={styles.itemText}>
          "{item.text}"
        </Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Dengarkan: ${item.text}`}
        onPress={() => onSpeak(item.text)}
        style={styles.speakBtn}
      >
        <Ionicons color={colors.primary} name="volume-high-outline" size={20} />
      </PressableScale>
    </View>
  );
}

export default function HistoryScreen() {
  useThemeMode();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  // Sisakan ruang bawah agar hasil terakhir tidak tertutup keyboard. Konten
  // membentang sampai tepi window (Screen memakai edge 'top' saja).
  const keyboardOverlap = useKeyboardWindowOverlap();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const scheduleClearHistory = useHistoryStore((state) => state.scheduleClearHistory);
  const undoClearHistory = useHistoryStore((state) => state.undoClearHistory);
  const [showUndo, setShowUndo] = useState(false);
  const history = useHistoryStore((state) =>
    user && !isGuest ? (state.itemsByUser[user.id] ?? EMPTY_HISTORY) : EMPTY_HISTORY
  );
  const { speak } = useTTS();

  const sections = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const filtered =
      normalized.length === 0
        ? history
        : history.filter((item) => item.text.toLowerCase().includes(normalized));

    const grouped = new Map<string, TranslationHistoryItem[]>();
    for (const item of filtered) {
      const label = formatDayGroupLabel(item.createdAt);
      const bucket = grouped.get(label);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(label, [item]);
      }
    }

    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [history, searchText]);

  const handleClear = () => {
    if (!user || history.length === 0) {
      return;
    }

    Alert.alert('Hapus Riwayat?', `Semua ${history.length} riwayat terjemahan akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          scheduleClearHistory(user.id);
          setShowUndo(true);
        },
      },
    ]);
  };

  const handleUndo = () => {
    if (user) {
      undoClearHistory(user.id);
    }
    setShowUndo(false);
  };

  return (
    <Screen>
      <BackHeader
        onBack={() => router.back()}
        right={
          history.length > 0 ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Hapus semua riwayat"
              onPress={handleClear}
              style={styles.clearBtn}
            >
              <Ionicons color={colors.error} name="trash-outline" size={20} />
            </PressableScale>
          ) : undefined
        }
        title="Riwayat Terjemahan"
      />

      {isGuest ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            actionLabel="Masuk / Daftar"
            description="Masuk dengan akun untuk menyimpan dan melihat kembali hasil terjemahanmu."
            icon="lock-closed-outline"
            onAction={() => router.replace('/(auth)/login')}
            title="Riwayat tidak tersimpan di mode tamu"
          />
        </View>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <SearchBar
              onChangeText={setSearchText}
              onClear={() => setSearchText('')}
              placeholder="Cari riwayat terjemahan..."
              value={searchText}
            />
          </View>

          <SectionList
            contentContainerStyle={[
              styles.listContent,
              sections.length === 0 && styles.emptyListContent,
              keyboardOverlap > 0 && { paddingBottom: spacing.xl + keyboardOverlap },
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <EmptyState
                description={
                  searchText.trim().length > 0
                    ? 'Tidak ada riwayat yang cocok dengan kata kunci itu.'
                    : 'Hasil terjemahanmu akan otomatis tersimpan di sini.'
                }
                icon="time-outline"
                title={searchText.trim().length > 0 ? 'Tidak ditemukan' : 'Belum ada riwayat'}
              />
            }
            renderItem={({ item }) => <HistoryRow item={item} onSpeak={speak} />}
            renderSectionHeader={({ section }) => (
              <Text variant="kicker" color="secondary" style={styles.sectionTitle}>
                {section.title}
              </Text>
            )}
            sections={sections}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            style={styles.list}
          />
        </>
      )}

      <Snackbar
        actionLabel="Urungkan"
        durationMs={CLEAR_HISTORY_UNDO_MS}
        message="Riwayat terjemahan dihapus"
        onAction={handleUndo}
        onDismiss={() => setShowUndo(false)}
        visible={showUndo}
      />
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.errorTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconPrimary: {
    backgroundColor: colors.primarySurface,
  },
  itemIconAccent: {
    backgroundColor: colors.accentSurface,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemText: {
    lineHeight: 21,
  },
  speakBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
