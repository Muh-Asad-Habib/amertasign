import * as Speech from 'expo-speech';

export const TTS = {
  speak: (text: string, language: string = 'id-ID') => {
    Speech.speak(text, {
      language,
      pitch: 1.0,
      rate: 0.9,
    });
  },
  stop: () => {
    Speech.stop();
  },
  isSpeaking: async (): Promise<boolean> => {
    return Speech.isSpeakingAsync();
  },
};
