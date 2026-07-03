// Mock service — stores data in memory for now
// TODO: Ganti dengan panggilan REST API (/favorites, dan opsional /search-history).

interface UserProgress {
  favorites: string[];
  searchHistory: string[];
  streak: number;
  lastActiveDate: string;
}

const mockStorage: Record<string, UserProgress> = {};

const createDefaultProgress = (): UserProgress => ({
  favorites: [],
  searchHistory: [],
  streak: 0,
  lastActiveDate: new Date().toISOString(),
});

const upsertUserProgress = (userId: string, progress: Partial<UserProgress>) => {
  mockStorage[userId] = {
    ...createDefaultProgress(),
    ...mockStorage[userId],
    ...progress,
    lastActiveDate: new Date().toISOString(),
  };
};

export const Database = {
  saveProgress: async (userId: string, progress: Partial<UserProgress>): Promise<void> => {
    upsertUserProgress(userId, progress);
  },

  getProgress: async (userId: string): Promise<UserProgress | null> => {
    return mockStorage[userId] || null;
  },

  saveFavorites: async (userId: string, favorites: string[]): Promise<void> => {
    upsertUserProgress(userId, { favorites });
  },

  saveSearchHistory: async (userId: string, history: string[]): Promise<void> => {
    upsertUserProgress(userId, { searchHistory: history });
  },
};
