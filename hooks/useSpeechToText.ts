import { useCallback, useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';

/**
 * Modul native expo-speech-recognition dimuat secara lazy dan HANYA di luar
 * Expo Go: di Expo Go, require terhadap modul native memicu fatal error Metro
 * (tidak bisa ditangkap try/catch), jadi kita cek executionEnvironment dulu.
 */
type SpeechModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  addListener: (event: string, listener: (payload: any) => void) => { remove: () => void };
};

/** true bila berjalan di aplikasi Expo Go (native module custom tidak tersedia). */
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

let cachedModule: SpeechModule | null = null;
let loadAttempted = false;

function getSpeechModule(): SpeechModule | null {
  if (IS_EXPO_GO) {
    return null;
  }
  if (!loadAttempted) {
    loadAttempted = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cachedModule = require('expo-speech-recognition').ExpoSpeechRecognitionModule ?? null;
    } catch {
      cachedModule = null;
    }
  }
  return cachedModule;
}

export interface UseSpeechToTextOptions {
  /** Dipanggil saat ada hasil transkrip (interim maupun final). */
  onResult: (transcript: string, isFinal: boolean) => void;
  language?: string;
}

export function useSpeechToText({ onResult, language = 'id-ID' }: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isAvailable = getSpeechModule() !== null;

  useEffect(() => {
    const speech = getSpeechModule();
    if (!speech) {
      return;
    }

    const subscriptions = [
      speech.addListener('result', (event: any) => {
        const transcript: string = event?.results?.[0]?.transcript ?? '';
        if (transcript) {
          onResultRef.current(transcript, Boolean(event?.isFinal));
        }
      }),
      speech.addListener('end', () => setIsListening(false)),
      speech.addListener('error', () => setIsListening(false)),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  const start = useCallback(async () => {
    const speech = getSpeechModule();
    if (!speech || isListening) {
      return false;
    }

    try {
      const { granted } = await speech.requestPermissionsAsync();
      if (!granted) {
        return false;
      }

      speech.start({
        lang: language,
        interimResults: true,
        continuous: false,
      });
      setIsListening(true);
      return true;
    } catch {
      setIsListening(false);
      return false;
    }
  }, [isListening, language]);

  const stop = useCallback(() => {
    const speech = getSpeechModule();
    if (speech) {
      try {
        speech.stop();
      } catch {
        // Sudah berhenti — abaikan.
      }
    }
    setIsListening(false);
  }, []);

  return {
    /** false di Expo Go — butuh development build dengan modul native. */
    isAvailable,
    isListening,
    start,
    stop,
  };
}
