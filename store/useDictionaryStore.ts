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
  /** Muat favorit dari backend (dipanggil setelah login / app start). */
  loadFavorites: () => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const getActiveUserId = () => useAuthStore.getState().user?.id ?? 'guest-user';

export const useDictionaryStore = create<DictionaryStoreState>((set, get) => ({
  favorites: [],
  searchHistory: [],
  signLanguageFilter: 'bisindo',
  toggleFavorite: (id) => {
    const userId = getActiveUserId();
    const wasFavorite = get().favorites.includes(id);

    // Update optimistis, lalu sinkron ke backend.
    set((state) => ({
      favorites: wasFavorite
        ? state.favorites.filter((favoriteId) => favoriteId !== id)
        : [id, ...state.favorites],
    }));

    const sync = wasFavorite
      ? Database.removeFavorite(userId, id)
      : Database.addFavorite(userId, id);

    void sync.catch(() => {
      // Gagal sinkron → kembalikan state semula.
      set((state) => ({
        favorites: wasFavorite
          ? [id, ...state.favorites]
          : state.favorites.filter((favoriteId) => favoriteId !== id),
      }));
    });
  },
  addToHistory: (id) => {
    set((state) => ({
      searchHistory: [id, ...state.searchHistory.filter((historyId) => historyId !== id)].slice(0, 10),
    }));

    void Database.saveSearchHistory(getActiveUserId(), get().searchHistory).catch(() => {});
  },
  setSignLanguageFilter: (type) => {
    set({ signLanguageFilter: type });
  },
  loadFavorites: async () => {
    try {
      const progress = await Database.getProgress(getActiveUserId());
      if (progress) {
        set({ favorites: progress.favorites, searchHistory: progress.searchHistory });
      }
    } catch {
      // Offline / belum login — biarkan state lokal.
    }
  },
  isFavorite: (id) => get().favorites.includes(id),
}));
