import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { fetchDictionaryEntries, invalidateDictionaryCache } from '../services/dictionary';
import { useDictionaryStore } from '../store/useDictionaryStore';
import type { DictionaryCategory, DictionaryEntry } from '../types';

type DictionaryCategoryFilter = DictionaryCategory | 'semua';

interface UseDictionaryOptions {
  category?: DictionaryCategoryFilter;
  search?: string;
}

export function useDictionary(options: UseDictionaryOptions = {}) {
  const { category = 'semua', search = '' } = options;
  // Mulai kosong (bukan data contoh) — layar menampilkan skeleton selama
  // isLoadingEntries; fallback mock hanya dipakai bila backend tak terjangkau.
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const favorites = useDictionaryStore((state) => state.favorites);
  const searchHistory = useDictionaryStore((state) => state.searchHistory);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const toggleFavorite = useDictionaryStore((state) => state.toggleFavorite);
  const addToHistory = useDictionaryStore((state) => state.addToHistory);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);
  const isFavorite = useDictionaryStore((state) => state.isFavorite);

  const load = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setIsLoadingEntries(true);
    }
    try {
      const result = await fetchDictionaryEntries();
      setEntries(result.entries);
      setIsOffline(result.isFallback);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchDictionaryEntries()
      .then((result) => {
        if (isMounted) {
          setEntries(result.entries);
          setIsOffline(result.isFallback);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingEntries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Saat aplikasi kembali dibuka, ambil data terbaru bila sebelumnya offline
  // agar pengguna tidak terjebak melihat data contoh sepanjang sesi.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isOffline) {
        invalidateDictionaryCache();
        void load({ silent: true });
      }
    });

    return () => subscription.remove();
  }, [isOffline, load]);

  /** Muat ulang paksa dari backend (pull-to-refresh / tombol coba lagi). */
  const refresh = useCallback(async () => {
    invalidateDictionaryCache();
    await load({ silent: true });
  }, [load]);

  const normalizedSearch = search.trim().toLowerCase();

  const matchesFilters = (entry: DictionaryEntry) => {
    const matchesCategory = category === 'semua' || entry.category === category;
    const matchesType = entry.type === signLanguageFilter;
    const matchesSearch =
      normalizedSearch.length === 0 || entry.word.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesType && matchesSearch;
  };

  const resolveEntries = (ids: string[]) =>
    ids
      .map((id) => entries.find((entry) => entry.id === id))
      .filter((entry): entry is DictionaryEntry => Boolean(entry));

  const filteredEntries = useMemo(
    () => entries.filter(matchesFilters),
    [entries, category, normalizedSearch, signLanguageFilter]
  );

  const favoriteEntries = useMemo(
    () => resolveEntries(favorites).filter(matchesFilters),
    [entries, favorites, category, normalizedSearch, signLanguageFilter]
  );

  const historyEntries = useMemo(
    () => resolveEntries(searchHistory).filter(matchesFilters),
    [entries, searchHistory, category, normalizedSearch, signLanguageFilter]
  );

  return {
    allEntries: entries,
    isLoadingEntries,
    isOffline,
    refresh,
    filteredEntries,
    favoriteEntries,
    historyEntries,
    favorites,
    searchHistory,
    signLanguageFilter,
    toggleFavorite,
    addToHistory,
    setSignLanguageFilter,
    isFavorite,
  };
}
