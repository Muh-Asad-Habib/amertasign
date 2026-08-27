import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Status cermin KAMERA DEPAN perangkat ini.
 *
 * Sebagian HP menyimpan rekaman kamera depan TERCERMIN, sebagian tidak —
 * opsi `mirror` recordAsync sudah deprecated dan di Android diabaikan (ikut
 * perilaku pabrikan), jadi status tiap perangkat harus dipelajari sekali lalu
 * dikirim sebagai penanda `orientasi` pada setiap unggahan. Kamera belakang
 * tidak pernah tercermin sehingga tak butuh store ini.
 *
 * Pengisian hanya OTOMATIS: server menebak lewat Mirror-TTA dan membalas
 * `orientation_used` (source "tta"); tiga tebakan pertama dikumpulkan sebagai
 * suara dan verdict terkunci saat suara BULAT. Layar kalibrasi manual sudah
 * dihapus — pengguna tidak perlu melakukan langkah tambahan apa pun.
 */
export type CameraOrientation = 'normal' | 'cermin';
export type OrientationSource = 'auto';

/**
 * Jumlah suara TTA yang dikumpulkan sebelum verdict otomatis dikunci.
 *
 * Suara harus BULAT (semua sama). Verdict yang terkunci KELIRU jauh lebih
 * berbahaya daripada tidak punya verdict sama sekali: penanda salah membuat
 * server mengoreksi ke arah yang salah dan hasilnya "salah dengan yakin"
 * (terukur 27 Agu: angka 8 + penanda keliru terbaca "10" PD 0,94), sedangkan
 * tanpa penanda server masih menebak sendiri lewat Mirror-TTA (kata 11/12,
 * angka 31/38 pada rekaman tercermin). Karena itu mayoritas 2/3 diganti bulat.
 */
export const ORIENTATION_VOTES_NEEDED = 3;

interface OrientationState {
  /** Verdict kamera depan; null = belum diketahui (unggahan tanpa penanda). */
  frontOrientation: CameraOrientation | null;
  /** Asal verdict; kini selalu "auto" (kalibrasi manual dihapus). */
  source: OrientationSource | null;
  /** Suara tebakan TTA yang terkumpul (maks ORIENTATION_VOTES_NEEDED). */
  votes: CameraOrientation[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  /** Catat satu tebakan TTA; mengunci verdict saat suara cukup. */
  addVote: (orientation: CameraOrientation) => void;
  /** Buang verdict + suara (mulai lagi dari deteksi otomatis). */
  reset: () => void;
}

const STORAGE_KEY = 'amertasign.orientation';

interface PersistedOrientation {
  frontOrientation: CameraOrientation | null;
  source: OrientationSource | null;
  votes: CameraOrientation[];
}

const isOrientation = (value: unknown): value is CameraOrientation =>
  value === 'normal' || value === 'cermin';

const persist = (state: PersistedOrientation) => {
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
};

const snapshot = (state: OrientationState): PersistedOrientation => ({
  frontOrientation: state.frontOrientation,
  source: state.source,
  votes: state.votes,
});

/** Verdict dari suara terkumpul; null bila suara belum BULAT. */
export const majorityVerdict = (
  votes: CameraOrientation[],
  needed: number = ORIENTATION_VOTES_NEEDED
): CameraOrientation | null => {
  if (votes.length < needed) {
    return null;
  }
  const terakhir = votes.slice(-needed);
  const cermin = terakhir.filter((vote) => vote === 'cermin').length;
  if (cermin === needed) {
    return 'cermin';
  }
  if (cermin === 0) {
    return 'normal';
  }
  return null;
};

export const useOrientationStore = create<OrientationState>((set, get) => ({
  frontOrientation: null,
  source: null,
  votes: [],
  isHydrated: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistedOrientation>;
        set({
          frontOrientation: isOrientation(saved.frontOrientation)
            ? saved.frontOrientation
            : null,
          source: saved.source === 'auto' ? saved.source : null,
          votes: Array.isArray(saved.votes)
            ? saved.votes.filter(isOrientation).slice(0, ORIENTATION_VOTES_NEEDED)
            : [],
        });
      }
    } catch {
      // Simpanan rusak/tidak ada — mulai dari belum-diketahui.
    } finally {
      set({ isHydrated: true });
    }
  },
  addVote: (orientation) => {
    const state = get();
    // Verdict yang sudah terkunci tidak diubah suara baru (unggahan
    // berikutnya sudah memakai penanda sehingga server tidak menebak lagi —
    // tidak ada umpan balik ganda).
    if (state.frontOrientation !== null) {
      return;
    }
    const votes = [...state.votes, orientation].slice(-ORIENTATION_VOTES_NEEDED);
    const verdict = majorityVerdict(votes);
    set(
      verdict
        ? { votes, frontOrientation: verdict, source: 'auto' }
        : { votes }
    );
    persist(snapshot(get()));
  },
  reset: () => {
    set({ frontOrientation: null, source: null, votes: [] });
    persist(snapshot(get()));
  },
}));
