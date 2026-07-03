import { create } from 'zustand';

import { apiRequest } from '../services/api';
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
  isLoading: boolean;
  /** Muat riwayat user login dari backend (GET /history). */
  loadHistory: (userId: string) => Promise<void>;
  addEntry: (userId: string, entry: Omit<TranslationHistoryItem, 'id' | 'createdAt'>) => void;
  clearHistory: (userId: string) => void;
  getHistory: (userId: string) => TranslationHistoryItem[];
}

const MAX_ITEMS = 50;

const isGuest = (userId: string) => !userId || userId === 'guest-user';

export const useHistoryStore = create<HistoryState>((set, get) => ({
  itemsByUser: {},
  isLoading: false,
  loadHistory: async (userId) => {
    if (isGuest(userId)) {
      return;
    }

    set({ isLoading: true });
    try {
      const data = await apiRequest<{ items: TranslationHistoryItem[] }>(
        `/history?limit=${MAX_ITEMS}`,
        { auth: true }
      );
      set((state) => ({
        isLoading: false,
        itemsByUser: { ...state.itemsByUser, [userId]: data.items },
      }));
    } catch {
      set({ isLoading: false });
    }
  },
  addEntry: (userId, entry) => {
    if (isGuest(userId)) {
      return;
    }

    // Tampilkan langsung (optimistis), lalu simpan ke backend.
    const localItem: TranslationHistoryItem = {
      ...entry,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      itemsByUser: {
        ...state.itemsByUser,
        [userId]: [localItem, ...(state.itemsByUser[userId] ?? [])].slice(0, MAX_ITEMS),
      },
    }));

    void apiRequest<{ item: TranslationHistoryItem }>('/history', {
      method: 'POST',
      auth: true,
      body: {
        kind: entry.kind,
        text: entry.text,
        signLanguageType: entry.signLanguageType,
      },
    })
      .then(({ item }) => {
        // Ganti item lokal dengan item dari server (id & timestamp resmi).
        set((state) => ({
          itemsByUser: {
            ...state.itemsByUser,
            [userId]: (state.itemsByUser[userId] ?? []).map((existing) =>
              existing.id === localItem.id ? item : existing
            ),
          },
        }));
      })
      .catch(() => {
        // Gagal simpan ke server — item tetap tampil secara lokal untuk sesi ini.
      });
  },
  clearHistory: (userId) => {
    set((state) => ({
      itemsByUser: { ...state.itemsByUser, [userId]: [] },
    }));

    if (!isGuest(userId)) {
      void apiRequest('/history', { method: 'DELETE', auth: true }).catch(() => {});
    }
  },
  getHistory: (userId) => get().itemsByUser[userId] ?? [],
}));
