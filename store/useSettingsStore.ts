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
  /** Notifikasi push aplikasi. */
  pushNotifications: boolean;
  /** Notifikasi lewat email. */
  emailNotifications: boolean;
  /** Simpan riwayat terjemahan (privasi). */
  saveHistoryEnabled: boolean;
  /** Bagikan data penggunaan anonim untuk peningkatan model. */
  shareAnonData: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSpeechRate: (rate: SpeechRateMultiplier) => void;
  setVoiceGender: (gender: VoiceGender) => void;
  setAvatarGender: (gender: AvatarGender) => void;
  setThemeMode: (mode: ThemeScheme) => void;
  setPushNotifications: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setSaveHistoryEnabled: (enabled: boolean) => void;
  setShareAnonData: (enabled: boolean) => void;
}

const STORAGE_KEY = 'amertasign.settings';

interface PersistedSettings {
  speechRate: SpeechRateMultiplier;
  voiceGender: VoiceGender;
  avatarGender: AvatarGender;
  themeMode: ThemeScheme;
  pushNotifications: boolean;
  emailNotifications: boolean;
  saveHistoryEnabled: boolean;
  shareAnonData: boolean;
}

const persist = (settings: PersistedSettings) => {
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
};

const snapshot = (state: SettingsState): PersistedSettings => ({
  speechRate: state.speechRate,
  voiceGender: state.voiceGender,
  avatarGender: state.avatarGender,
  themeMode: state.themeMode,
  pushNotifications: state.pushNotifications,
  emailNotifications: state.emailNotifications,
  saveHistoryEnabled: state.saveHistoryEnabled,
  shareAnonData: state.shareAnonData,
});

/** Preferensi aplikasi (suara, peraga, tema, notifikasi, privasi) — tersimpan lokal. */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  speechRate: 1,
  voiceGender: 'female',
  avatarGender: 'female',
  themeMode: 'light',
  pushNotifications: true,
  emailNotifications: false,
  saveHistoryEnabled: true,
  shareAnonData: false,
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
          pushNotifications: saved.pushNotifications !== false,
          emailNotifications: saved.emailNotifications === true,
          saveHistoryEnabled: saved.saveHistoryEnabled !== false,
          shareAnonData: saved.shareAnonData === true,
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
  setPushNotifications: (enabled) => {
    set({ pushNotifications: enabled });
    persist(snapshot(get()));
  },
  setEmailNotifications: (enabled) => {
    set({ emailNotifications: enabled });
    persist(snapshot(get()));
  },
  setSaveHistoryEnabled: (enabled) => {
    set({ saveHistoryEnabled: enabled });
    persist(snapshot(get()));
  },
  setShareAnonData: (enabled) => {
    set({ shareAnonData: enabled });
    persist(snapshot(get()));
  },
}));
