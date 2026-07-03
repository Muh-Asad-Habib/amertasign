import { useCallback, useRef, useState } from 'react';

import { detectSign, textToSign, type TextToSignResult } from '../services/translation';

export type SignLanguageType = 'bisindo' | 'sibi';

const EMPTY_VISUAL_RESULT: TextToSignResult = {
  visualUrl: '',
  description: '',
};

export function useTranslation() {
  const [signLanguageType, setSignLanguageType] = useState<SignLanguageType>('bisindo');
  const [translatedText, setTranslatedText] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const requestIdRef = useRef(0);

  const startDetection = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsDetecting(true);
    setTranslatedText('');

    const result = await detectSign(true);

    if (requestIdRef.current === requestId) {
      setTranslatedText(result);
      setIsDetecting(false);
    }

    return result;
  }, []);

  const stopDetection = useCallback(() => {
    requestIdRef.current += 1;
    setIsDetecting(false);
    setTranslatedText('');
  }, []);

  const translateText = useCallback(
    async (text: string) => {
      const requestId = ++requestIdRef.current;

      setIsDetecting(true);

      const result = await textToSign(text, signLanguageType);

      if (requestIdRef.current === requestId) {
        setTranslatedText(result.description);
        setIsDetecting(false);
        return result;
      }

      return EMPTY_VISUAL_RESULT;
    },
    [signLanguageType]
  );

  return {
    signLanguageType,
    setSignLanguageType,
    translatedText,
    isDetecting,
    startDetection,
    stopDetection,
    translateText,
  };
}
