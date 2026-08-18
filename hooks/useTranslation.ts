import { useCallback, useRef, useState } from 'react';

import {
  recognizeMedia,
  recognizeSequence,
  textToSign,
  type MediaUpload,
  type RecognitionMode,
  type RecognitionStage,
  type SequenceRecognitionResult,
  type SignRecognitionResult,
  type TextToSignResult,
} from '../services/translation';
import { useSettingsStore } from '../store/useSettingsStore';

/** Aplikasi hanya mendukung BISINDO (Bahasa Isyarat Indonesia). */
export type SignLanguageType = 'bisindo';

const SIGN_LANGUAGE_TYPE: SignLanguageType = 'bisindo';

const EMPTY_VISUAL_RESULT: TextToSignResult = {
  text: '',
  signLanguageType: 'bisindo',
  units: [],
  unmatched: [],
};

export function useTranslation() {
  const [translatedText, setTranslatedText] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const requestIdRef = useRef(0);

  const translateMedia = useCallback(async (
    media: MediaUpload,
    stage: RecognitionStage
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

  /** Rekaman video → rangkaian isyarat (beberapa huruf/angka + kata). */
  const translateSequence = useCallback(async (
    video: MediaUpload,
    durationMs?: number,
    mode?: RecognitionMode
  ): Promise<SequenceRecognitionResult> => {
    const requestId = ++requestIdRef.current;
    setIsDetecting(true);
    setTranslatedText('');
    try {
      const result = await recognizeSequence(video, { durationMs, mode });
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

  const stopDetection = useCallback(() => {
    requestIdRef.current += 1;
    setIsDetecting(false);
    setTranslatedText('');
  }, []);

  const translateText = useCallback(async (text: string) => {
    const requestId = ++requestIdRef.current;

    setIsDetecting(true);
    try {
      // Karakter peraga (laki-laki/perempuan) mengikuti Pengaturan.
      const avatar = useSettingsStore.getState().avatarGender;
      const result = await textToSign(text, SIGN_LANGUAGE_TYPE, avatar);
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
  }, []);

  return {
    signLanguageType: SIGN_LANGUAGE_TYPE,
    translatedText,
    isDetecting,
    translateMedia,
    translateSequence,
    stopDetection,
    translateText,
  };
}
