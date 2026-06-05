import { useCallback, useEffect, useRef, useState } from 'react';

import { TTS } from '../services/tts';

const SPEAKING_POLL_INTERVAL = 300;

export function useTTS(language: string = 'id-ID') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  const refreshSpeakingState = useCallback(async () => {
    const speaking = await TTS.isSpeaking();
    setIsSpeaking(speaking);

    if (!speaking) {
      stopPolling();
    }

    return speaking;
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (pollerRef.current) {
      return;
    }

    pollerRef.current = setInterval(() => {
      void refreshSpeakingState();
    }, SPEAKING_POLL_INTERVAL);
  }, [refreshSpeakingState]);

  const speak = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return;
      }

      TTS.speak(text, language);
      setIsSpeaking(true);
      startPolling();
    },
    [language, startPolling]
  );

  const stop = useCallback(() => {
    TTS.stop();
    setIsSpeaking(false);
    stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    void refreshSpeakingState();

    return () => {
      stopPolling();
    };
  }, [refreshSpeakingState, stopPolling]);

  return {
    speak,
    stop,
    isSpeaking,
  };
}
