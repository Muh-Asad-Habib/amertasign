import { create } from 'zustand';

import { Database } from '../services/database';
import type { SignLanguageType } from '../types';
import { useAuthStore } from './useAuthStore';

interface DictionaryStoreState {
  favorites: string[];
  searchHistory: string[];
  signLanguageFilter: SignLanguageType;
  toggleFavorite: (id: string) => void;
  addToHistory: (id: string) => void;
  setSignLanguageFilter: (type: SignLanguageType) => void;
  syncToDatabase: () => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const getActiveUserId = () => useAuthStore.getState().user?.id ?? 'guest-user';

export const useDictionaryStore = create<DictionaryStoreState>((set, get) => ({
  favorites: [],
  searchHistory: [],
  signLanguageFilter: 'bisindo',
  toggleFavorite: (id) => {
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((favoriteId) => favoriteId !== id)
        : [id, ...state.favorites],
    }));

    void get().syncToDatabase();
  },
  addToHistory: (id) => {
    set((state) => ({
      searchHistory: [id, ...state.searchHistory.filter((historyId) => historyId !== id)].slice(0, 10),
    }));

    void get().syncToDatabase();
  },
  setSignLanguageFilter: (type) => {
    set({ signLanguageFilter: type });
  },
  syncToDatabase: async () => {
    const { favorites, searchHistory } = get();
    const userId = getActiveUserId();

    await Promise.all([
      Database.saveFavorites(userId, favorites),
      Database.saveSearchHistory(userId, searchHistory),
    ]);
  },
  isFavorite: (id) => get().favorites.includes(id),
}));
