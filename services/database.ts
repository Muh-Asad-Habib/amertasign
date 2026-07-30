import { apiRequest, tokenStorage } from './api';

interface UserProgress {
  favorites: string[];
  searchHistory: string[];
  streak: number;
  lastActiveDate: string;
}

const isGuest = (userId: string) => !userId || userId === 'guest-user';

/** SecureStore hanya menerima karakter aman untuk nama kunci. */
const storageKeyFor = (prefix: string, userId: string) =>
  `amertasign.${prefix}.${(userId || 'guest-user').replace(/[^A-Za-z0-9._-]/g, '_')}`;

const readIdList = async (key: string): Promise<string[]> => {
  try {
    const raw = await tokenStorage.get(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const writeIdList = async (key: string, ids: string[]): Promise<void> => {
  try {
    await tokenStorage.set(key, JSON.stringify(ids));
  } catch {
    // Gagal menulis bukan kondisi fatal — data hanya tidak bertahan.
  }
};

// Riwayat pencarian & favorit tamu disimpan lokal (belum ada endpoint backend),
// namun tetap persisten agar tidak hilang ketika aplikasi ditutup.
const searchHistoryKey = (userId: string) => storageKeyFor('searchHistory', userId);
const GUEST_FAVORITES_KEY = 'amertasign.guestFavorites';

export const Database = {
  getProgress: async (userId: string): Promise<UserProgress | null> => {
    const searchHistory = await readIdList(searchHistoryKey(userId));

    if (isGuest(userId)) {
      return {
        favorites: await readIdList(GUEST_FAVORITES_KEY),
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
      const current = await readIdList(GUEST_FAVORITES_KEY);
      if (!current.includes(entryId)) {
        await writeIdList(GUEST_FAVORITES_KEY, [entryId, ...current]);
      }
      return;
    }
    await apiRequest(`/favorites/${encodeURIComponent(entryId)}`, { method: 'PUT', auth: true });
  },

  removeFavorite: async (userId: string, entryId: string): Promise<void> => {
    if (isGuest(userId)) {
      const current = await readIdList(GUEST_FAVORITES_KEY);
      await writeIdList(
        GUEST_FAVORITES_KEY,
        current.filter((id) => id !== entryId)
      );
      return;
    }
    await apiRequest(`/favorites/${encodeURIComponent(entryId)}`, { method: 'DELETE', auth: true });
  },

  saveSearchHistory: async (userId: string, history: string[]): Promise<void> => {
    await writeIdList(searchHistoryKey(userId), history);
  },

  /** Bersihkan data lokal milik pengguna (dipakai saat keluar dari akun). */
  clearLocalData: async (userId: string): Promise<void> => {
    try {
      await tokenStorage.remove(searchHistoryKey(userId));
    } catch {
      // Diabaikan — data lokal sudah tidak dapat diakses akun lain.
    }
  },
};
