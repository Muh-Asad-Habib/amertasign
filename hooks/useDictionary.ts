import { useEffect, useMemo, useState } from 'react';

import { dictionaryEntries as fallbackEntries } from '../constants/MockData';
import { fetchDictionaryEntries } from '../services/dictionary';
import { useDictionaryStore } from '../store/useDictionaryStore';
import type { DictionaryCategory, DictionaryEntry } from '../types';

type DictionaryCategoryFilter = DictionaryCategory | 'semua';

interface UseDictionaryOptions {
  category?: DictionaryCategoryFilter;
  search?: string;
}

export function useDictionary(options: UseDictionaryOptions = {}) {
  const { category = 'semua', search = '' } = options;
  const [entries, setEntries] = useState<DictionaryEntry[]>(fallbackEntries);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const favorites = useDictionaryStore((state) => state.favorites);
  const searchHistory = useDictionaryStore((state) => state.searchHistory);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const toggleFavorite = useDictionaryStore((state) => state.toggleFavorite);
  const addToHistory = useDictionaryStore((state) => state.addToHistory);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);
  const isFavorite = useDictionaryStore((state) => state.isFavorite);

  useEffect(() => {
    let isMounted = true;

    void fetchDictionaryEntries()
      .then((items) => {
        if (isMounted) {
          setEntries(items);
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
