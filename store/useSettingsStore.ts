import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { setActiveColorScheme, type ThemeScheme } from '../theme/colors';

/** Pengganda kecepatan suara TTS (0,5x lambat · 1x normal · 1,5x cepat). */
export type SpeechRateMultiplier = 0.5 | 1 | 1.5;
/** Jenis suara TTS — didekati lewat pemilihan voice + pitch. */
export type VoiceGender = 'male' | 'female';
/** Karakter peraga isyarat untuk visual teks → isyarat. */
export type AvatarGender = 'male' | 'female';
/** Pengganda kecepatan peragaan isyarat (0,5x lambat · 1x normal · 1,5x cepat). */
export type SignSpeedMultiplier = 0.5 | 1 | 1.5;

const SIGN_SPEED_VALUES: SignSpeedMultiplier[] = [0.5, 1, 1.5];

const normalizeSignSpeed = (value: unknown): SignSpeedMultiplier =>
  SIGN_SPEED_VALUES.includes(value as SignSpeedMultiplier) ? (value as SignSpeedMultiplier) : 1;

interface SettingsState {
  speechRate: SpeechRateMultiplier;
  voiceGender: VoiceGender;
  avatarGender: AvatarGender;
  /** Kecepatan pemutaran rangkaian peraga isyarat. */
  signSpeed: SignSpeedMultiplier;
  themeMode: ThemeScheme;
  /** Simpan riwayat terjemahan (privasi). */
  saveHistoryEnabled: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSpeechRate: (rate: SpeechRateMultiplier) => void;
  setVoiceGender: (gender: VoiceGender) => void;
  setAvatarGender: (gender: AvatarGender) => void;
  setSignSpeed: (speed: SignSpeedMultiplier) => void;
  setThemeMode: (mode: ThemeScheme) => void;
  setSaveHistoryEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'amertasign.settings';

interface PersistedSettings {
  speechRate: SpeechRateMultiplier;
  voiceGender: VoiceGender;
  avatarGender: AvatarGender;
  signSpeed: SignSpeedMultiplier;
  themeMode: ThemeScheme;
  saveHistoryEnabled: boolean;
}

const persist = (settings: PersistedSettings) => {
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
};

const snapshot = (state: SettingsState): PersistedSettings => ({
  speechRate: state.speechRate,
  voiceGender: state.voiceGender,
  avatarGender: state.avatarGender,
  signSpeed: state.signSpeed,
  themeMode: state.themeMode,
  saveHistoryEnabled: state.saveHistoryEnabled,
});

/** Preferensi aplikasi (suara, peraga, tema, privasi) — tersimpan lokal. */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  speechRate: 1,
  voiceGender: 'female',
  avatarGender: 'female',
  signSpeed: 1,
  themeMode: 'light',
  saveHistoryEnabled: true,
  isHydrated: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistedSettings>;
        const themeMode: ThemeScheme = saved.themeMode === 'dark' ? 'dark' : 'light';
        setActiveColorScheme(themeMode);
        set({
          speechRate: saved.speechRate === 0.5 || saved.speechRate === 1.5 ? saved.speechRate : 1,
          voiceGender: saved.voiceGender === 'male' ? 'male' : 'female',
          avatarGender: saved.avatarGender === 'male' ? 'male' : 'female',
          signSpeed: normalizeSignSpeed(saved.signSpeed),
          themeMode,
          saveHistoryEnabled: saved.saveHistoryEnabled !== false,
        });
      }
    } catch {
      // Simpanan rusak/tidak ada — pakai default.
    } finally {
      set({ isHydrated: true });
    }
  },
  setSpeechRate: (rate) => {
    set({ speechRate: rate });
    persist(snapshot(get()));
  },
  setVoiceGender: (gender) => {
    set({ voiceGender: gender });
    persist(snapshot(get()));
  },
  setAvatarGender: (gender) => {
    set({ avatarGender: gender });
    persist(snapshot(get()));
  },
  setSignSpeed: (speed) => {
    set({ signSpeed: normalizeSignSpeed(speed) });
    persist(snapshot(get()));
  },
  setThemeMode: (mode) => {
    setActiveColorScheme(mode);
    set({ themeMode: mode });
    persist(snapshot(get()));
  },
  setSaveHistoryEnabled: (enabled) => {
    set({ saveHistoryEnabled: enabled });
    persist(snapshot(get()));
  },
}));
