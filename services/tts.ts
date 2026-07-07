import * as Speech from 'expo-speech';

export type TTSGender = 'male' | 'female';

export interface SpeakOptions {
  /** Pengganda kecepatan (0.5 lambat · 1 normal · 1.5 cepat). */
  rateMultiplier?: number;
  /** Jenis suara — memilih voice perangkat bila ada, plus penyesuaian pitch. */
  gender?: TTSGender;
}

/** Kecepatan dasar yang nyaman untuk bahasa Indonesia. */
const BASE_RATE = 0.9;

/**
 * Pitch per jenis suara — dibuat lembut (soft spoken):
 * laki-laki sedikit lebih rendah tanpa terdengar ngebass,
 * perempuan natural tanpa melengking.
 */
const PITCH_BY_GENDER: Record<TTSGender, number> = {
  male: 0.85,
  female: 1.02,
};

let voicesPromise: Promise<Speech.Voice[]> | null = null;

async function getIndonesianVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) {
    voicesPromise = Speech.getAvailableVoicesAsync()
      .then((voices) =>
        voices
          .filter((voice) => (voice.language ?? '').toLowerCase().startsWith('id'))
          .sort((a, b) => a.identifier.localeCompare(b.identifier))
      )
      .catch(() => []);
  }
  return voicesPromise;
}

/**
 * Pilih voice perangkat per jenis suara. Metadata gender tidak diekspos oleh
 * Android/iOS, jadi heuristiknya: pakai dua voice id-ID berbeda (bila tersedia)
 * agar laki-laki & perempuan tidak terdengar identik, dikombinasikan dengan pitch.
 */
async function pickVoice(gender: TTSGender): Promise<string | undefined> {
  const voices = await getIndonesianVoices();
  if (voices.length === 0) {
    return undefined;
  }
  if (voices.length === 1) {
    return voices[0].identifier;
  }
  return gender === 'female' ? voices[0].identifier : voices[voices.length - 1].identifier;
}

export const TTS = {
  speak: (text: string, language: string = 'id-ID', options: SpeakOptions = {}) => {
    const { rateMultiplier = 1, gender = 'female' } = options;

    void pickVoice(gender).then((voice) => {
      Speech.speak(text, {
        language,
        voice,
        pitch: PITCH_BY_GENDER[gender],
        rate: BASE_RATE * rateMultiplier,
      });
    });
  },
  stop: () => {
    Speech.stop();
  },
  isSpeaking: async (): Promise<boolean> => {
    return Speech.isSpeakingAsync();
  },
};
