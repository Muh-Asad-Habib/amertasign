import { create } from 'zustand';

import { apiRequest } from '../services/api';
import type { SignLanguageType } from '../types';
import { useSettingsStore } from './useSettingsStore';

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
  /**
   * Kosongkan riwayat di layar lebih dulu dan tunda penghapusan di server,
   * sehingga pengguna sempat mengurungkan lewat snackbar.
   */
  scheduleClearHistory: (userId: string) => void;
  /** Batalkan penghapusan yang masih tertunda dan kembalikan riwayat. */
  undoClearHistory: (userId: string) => void;
  getHistory: (userId: string) => TranslationHistoryItem[];
  /**
   * Eksekusi segera semua penghapusan tertunda (dipanggil sebelum logout,
   * selagi token masih valid — timer yang menyala setelah logout akan gagal 401).
   * Await selesai sebelum POST /auth/logout agar DELETE tidak balapan dengan
   * pencabutan sesi di server.
   */
  flushPendingClears: () => Promise<void>;
  /** Bersihkan seluruh riwayat di memori (dipanggil saat logout) agar tidak bocor antar akun. */
  reset: () => void;
}

/** Jeda sebelum penghapusan riwayat benar-benar dikirim ke server. */
export const CLEAR_HISTORY_UNDO_MS = 5000;

interface PendingClear {
  items: TranslationHistoryItem[];
  timer: ReturnType<typeof setTimeout>;
}

const pendingClears = new Map<string, PendingClear>();

/** Maksimal riwayat per arah: 10 teks/audio→isyarat dan 10 isyarat→teks/audio. */
const MAX_ITEMS_PER_KIND = 10;

const isGuest = (userId: string) => !userId || userId === 'guest-user';

/** Urutkan terbaru dulu, lalu batasi tiap arah terjemahan maksimal 10 item. */
const capPerKind = (items: TranslationHistoryItem[]): TranslationHistoryItem[] => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const counts: Record<TranslationKind, number> = {
    'isyarat-ke-teks': 0,
    'teks-ke-isyarat': 0,
  };
  return sorted.filter((item) => {
    counts[item.kind] += 1;
    return counts[item.kind] <= MAX_ITEMS_PER_KIND;
  });
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  itemsByUser: {},
  isLoading: false,
  loadHistory: async (userId) => {
    if (isGuest(userId)) {
      return;
    }

    set({ isLoading: true });
    try {
      // Ambil per arah agar tiap arah tepat maksimal 10 item. allSettled:
      // satu arah gagal tidak membatalkan arah lainnya (muat parsial).
      const results = await Promise.allSettled([
        apiRequest<{ items: TranslationHistoryItem[] }>(
          `/history?limit=${MAX_ITEMS_PER_KIND}&kind=isyarat-ke-teks`,
          { auth: true }
        ),
        apiRequest<{ items: TranslationHistoryItem[] }>(
          `/history?limit=${MAX_ITEMS_PER_KIND}&kind=teks-ke-isyarat`,
          { auth: true }
        ),
      ]);

      const items = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.items : []
      );
      const allFailed = results.every((result) => result.status === 'rejected');

      set((state) => ({
        isLoading: false,
        // Semua permintaan gagal → pertahankan data lama daripada mengosongkan layar.
        itemsByUser: allFailed
          ? state.itemsByUser
          : {
              ...state.itemsByUser,
              [userId]: capPerKind(items),
            },
      }));
    } catch {
      set({ isLoading: false });
    }
  },
  addEntry: (userId, entry) => {
    if (isGuest(userId)) {
      return;
    }

    // Privasi: pengguna bisa mematikan penyimpanan riwayat di pengaturan.
    if (!useSettingsStore.getState().saveHistoryEnabled) {
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
        [userId]: capPerKind([localItem, ...(state.itemsByUser[userId] ?? [])]),
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
  scheduleClearHistory: (userId) => {
    const snapshot = get().itemsByUser[userId] ?? [];
    if (snapshot.length === 0) {
      return;
    }

    // Penghapusan sebelumnya yang masih tertunda langsung dieksekusi agar
    // tidak ada dua timer yang saling menimpa.
    const existing = pendingClears.get(userId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    set((state) => ({
      itemsByUser: { ...state.itemsByUser, [userId]: [] },
    }));

    const timer = setTimeout(() => {
      pendingClears.delete(userId);
      if (!isGuest(userId)) {
        void apiRequest('/history', { method: 'DELETE', auth: true }).catch(() => {});
      }
    }, CLEAR_HISTORY_UNDO_MS);

    pendingClears.set(userId, { items: existing?.items ?? snapshot, timer });
  },
  undoClearHistory: (userId) => {
    const pending = pendingClears.get(userId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    pendingClears.delete(userId);
    set((state) => ({
      itemsByUser: { ...state.itemsByUser, [userId]: pending.items },
    }));
  },
  getHistory: (userId) => get().itemsByUser[userId] ?? [],
  flushPendingClears: async () => {
    const deletions: Promise<unknown>[] = [];
    pendingClears.forEach(({ timer }, userId) => {
      clearTimeout(timer);
      if (!isGuest(userId)) {
        deletions.push(apiRequest('/history', { method: 'DELETE', auth: true }));
      }
    });
    pendingClears.clear();
    await Promise.allSettled(deletions);
  },
  reset: () => {
    pendingClears.forEach(({ timer }) => clearTimeout(timer));
    pendingClears.clear();
    set({ itemsByUser: {}, isLoading: false });
  },
}));
