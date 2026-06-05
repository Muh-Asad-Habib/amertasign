import { useMemo } from 'react';

import { dictionaryEntries } from '../constants/MockData';
import { useDictionaryStore } from '../store/useDictionaryStore';
import type { DictionaryCategory, DictionaryEntry } from '../types';

type DictionaryCategoryFilter = DictionaryCategory | 'semua';

interface UseDictionaryOptions {
  category?: DictionaryCategoryFilter;
  search?: string;
}

const resolveEntries = (ids: string[]) =>
  ids
    .map((id) => dictionaryEntries.find((entry) => entry.id === id))
    .filter((entry): entry is DictionaryEntry => Boolean(entry));

export function useDictionary(options: UseDictionaryOptions = {}) {
  const { category = 'semua', search = '' } = options;
  const favorites = useDictionaryStore((state) => state.favorites);
  const searchHistory = useDictionaryStore((state) => state.searchHistory);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const toggleFavorite = useDictionaryStore((state) => state.toggleFavorite);
  const addToHistory = useDictionaryStore((state) => state.addToHistory);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);
  const isFavorite = useDictionaryStore((state) => state.isFavorite);

  const normalizedSearch = search.trim().toLowerCase();

  const matchesFilters = (entry: DictionaryEntry) => {
    const matchesCategory = category === 'semua' || entry.category === category;
    const matchesType = entry.type === signLanguageFilter;
    const matchesSearch =
      normalizedSearch.length === 0 || entry.word.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesType && matchesSearch;
  };

  const filteredEntries = useMemo(
    () => dictionaryEntries.filter(matchesFilters),
    [category, normalizedSearch, signLanguageFilter]
  );

  const favoriteEntries = useMemo(
    () => resolveEntries(favorites).filter(matchesFilters),
    [favorites, category, normalizedSearch, signLanguageFilter]
  );

  const historyEntries = useMemo(
    () => resolveEntries(searchHistory).filter(matchesFilters),
    [searchHistory, category, normalizedSearch, signLanguageFilter]
  );

  return {
    allEntries: dictionaryEntries,
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
