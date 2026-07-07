import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { setActiveColorScheme, type ThemeScheme } from '../theme/colors';

/** Pengganda kecepatan suara TTS (0,5x lambat · 1x normal · 1,5x cepat). */
export type SpeechRateMultiplier = 0.5 | 1 | 1.5;
/** Jenis suara TTS — didekati lewat pemilihan voice + pitch. */
export type VoiceGender = 'male' | 'female';
/** Karakter peraga isyarat untuk visual teks → isyarat. */
export type AvatarGender = 'male' | 'female';

interface SettingsState {
  speechRate: SpeechRateMultiplier;
  voiceGender: VoiceGender;
  avatarGender: AvatarGender;
  themeMode: ThemeScheme;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSpeechRate: (rate: SpeechRateMultiplier) => void;
  setVoiceGender: (gender: VoiceGender) => void;
  setAvatarGender: (gender: AvatarGender) => void;
  setThemeMode: (mode: ThemeScheme) => void;
}

const STORAGE_KEY = 'amertasign.settings';

interface PersistedSettings {
  speechRate: SpeechRateMultiplier;
  voiceGender: VoiceGender;
  avatarGender: AvatarGender;
  themeMode: ThemeScheme;
}

const persist = (settings: PersistedSettings) => {
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
};

const snapshot = (state: SettingsState): PersistedSettings => ({
  speechRate: state.speechRate,
  voiceGender: state.voiceGender,
  avatarGender: state.avatarGender,
  themeMode: state.themeMode,
});

/** Preferensi aplikasi (suara, peraga, tema) — tersimpan lokal di perangkat. */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  speechRate: 1,
  voiceGender: 'female',
  avatarGender: 'female',
  themeMode: 'light',
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
          themeMode,
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
  setThemeMode: (mode) => {
    setActiveColorScheme(mode);
    set({ themeMode: mode });
    persist(snapshot(get()));
  },
}));
