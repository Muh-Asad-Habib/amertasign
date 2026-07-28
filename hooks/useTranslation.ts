import { useCallback, useRef, useState } from 'react';

import {
  recognizeAuto,
  recognizeMedia,
  textToSign,
  type AutoRecognitionResult,
  type MediaUpload,
  type SignRecognitionResult,
  type TextToSignResult,
} from '../services/translation';

/** Aplikasi hanya mendukung BISINDO (Bahasa Isyarat Indonesia). */
export type SignLanguageType = 'bisindo';

const EMPTY_VISUAL_RESULT: TextToSignResult = {
  text: '',
  signLanguageType: 'bisindo',
  units: [],
  unmatched: [],
};

export function useTranslation() {
  const [signLanguageType, setSignLanguageType] = useState<SignLanguageType>('bisindo');
  const [translatedText, setTranslatedText] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const requestIdRef = useRef(0);

  const translateMedia = useCallback(async (
    media: MediaUpload,
    stage: 'abjad' | 'kata'
  ): Promise<SignRecognitionResult> => {
    const requestId = ++requestIdRef.current;
    setIsDetecting(true);
    setTranslatedText('');
    try {
      const result = await recognizeMedia(media, stage);
      if (requestIdRef.current === requestId) {
        setTranslatedText(result.text || result.note || 'Isyarat belum dikenali.');
      }
      return result;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsDetecting(false);
      }
    }
  }, []);

  /** Rekaman video → deteksi otomatis huruf / angka / kata. */
  const translateAuto = useCallback(async (
    video: MediaUpload,
    durationMs?: number
  ): Promise<AutoRecognitionResult> => {
    const requestId = ++requestIdRef.current;
    setIsDetecting(true);
    setTranslatedText('');
    try {
      const result = await recognizeAuto(video, { durationMs });
      if (requestIdRef.current === requestId) {
        setTranslatedText(result.text || result.note || 'Isyarat belum dikenali.');
      }
      return result;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsDetecting(false);
      }
    }
  }, []);

  const stopDetection = useCallback(() => {    requestIdRef.current += 1;
    setIsDetecting(false);
    setTranslatedText('');
  }, []);

  const translateText = useCallback(
    async (text: string) => {
      const requestId = ++requestIdRef.current;

      setIsDetecting(true);
      try {
        const result = await textToSign(text, signLanguageType);
        if (requestIdRef.current === requestId) {
          setTranslatedText(result.text);
          return result;
        }
        return EMPTY_VISUAL_RESULT;
      } finally {
        if (requestIdRef.current === requestId) {
          setIsDetecting(false);
        }
      }
    },
    [signLanguageType]
  );

  return {
    signLanguageType,
    setSignLanguageType,
    translatedText,
    isDetecting,
    translateMedia,
    translateAuto,
    stopDetection,
    translateText,
  };
}
