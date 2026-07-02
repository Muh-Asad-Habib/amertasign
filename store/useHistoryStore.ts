import { create } from 'zustand';

import type { SignLanguageType } from '../types';

export type TranslationKind = 'isyarat-ke-teks' | 'teks-ke-isyarat';

export interface TranslationHistoryItem {
  id: string;
  kind: TranslationKind;
  text: string;
  signLanguageType: SignLanguageType;
  createdAt: string;
}

interface HistoryState {
  /** Riwayat per userId — tamu tidak punya entri. */
  itemsByUser: Record<string, TranslationHistoryItem[]>;
  addEntry: (userId: string, entry: Omit<TranslationHistoryItem, 'id' | 'createdAt'>) => void;
  clearHistory: (userId: string) => void;
  getHistory: (userId: string) => TranslationHistoryItem[];
}

const MAX_ITEMS = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  itemsByUser: {},
  addEntry: (userId, entry) => {
    if (!userId || userId === 'guest-user') {
      return;
    }

    set((state) => {
      const existing = state.itemsByUser[userId] ?? [];
      const item: TranslationHistoryItem = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };

      return {
        itemsByUser: {
          ...state.itemsByUser,
          [userId]: [item, ...existing].slice(0, MAX_ITEMS),
        },
      };
    });
  },
  clearHistory: (userId) => {
    set((state) => ({
      itemsByUser: { ...state.itemsByUser, [userId]: [] },
    }));
  },
  getHistory: (userId) => get().itemsByUser[userId] ?? [],
}));
