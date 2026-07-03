import { apiRequest } from './api';

interface UserProgress {
  favorites: string[];
  searchHistory: string[];
  streak: number;
  lastActiveDate: string;
}

// Riwayat pencarian kamus tetap lokal (belum ada endpoint /search-history di backend).
const localStorageByUser: Record<string, Pick<UserProgress, 'searchHistory'>> = {};

const isGuest = (userId: string) => !userId || userId === 'guest-user';

// Favorit tamu disimpan lokal saja.
const guestFavorites = new Set<string>();

export const Database = {
  getProgress: async (userId: string): Promise<UserProgress | null> => {
    const searchHistory = localStorageByUser[userId]?.searchHistory ?? [];

    if (isGuest(userId)) {
      return {
        favorites: [...guestFavorites],
        searchHistory,
        streak: 0,
        lastActiveDate: new Date().toISOString(),
      };
    }

    const data = await apiRequest<{ ids: string[] }>('/favorites', { auth: true });
    return {
      favorites: data.ids,
      searchHistory,
      streak: 0,
      lastActiveDate: new Date().toISOString(),
    };
  },

  addFavorite: async (userId: string, entryId: string): Promise<void> => {
    if (isGuest(userId)) {
      guestFavorites.add(entryId);
      return;
    }
    await apiRequest(`/favorites/${encodeURIComponent(entryId)}`, { method: 'PUT', auth: true });
  },

  removeFavorite: async (userId: string, entryId: string): Promise<void> => {
    if (isGuest(userId)) {
      guestFavorites.delete(entryId);
      return;
    }
    await apiRequest(`/favorites/${encodeURIComponent(entryId)}`, { method: 'DELETE', auth: true });
  },

  saveSearchHistory: async (userId: string, history: string[]): Promise<void> => {
    localStorageByUser[userId] = { searchHistory: history };
  },
};
