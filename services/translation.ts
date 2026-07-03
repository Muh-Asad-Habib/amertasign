import type { SignLanguageType } from '../types';
import { searchDictionary } from './dictionary';

export interface TextToSignResult {
  visualUrl: string;
  description: string;
}

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

/**
 * Deteksi isyarat dari kamera. Backend menyediakan POST /recognize dan
 * WS /ws/recognize yang menerima payload landmark MediaPipe — ekstraksi
 * landmark on-device belum tersedia di app, jadi fungsi ini masih simulasi.
 */
export async function detectSign(isActive: boolean): Promise<string> {
  if (!isActive) {
    await wait(300);
    return 'Menunggu deteksi gerakan...';
  }

  await wait(2000);
  return 'Halo, apa kabar?';
}

/**
 * Teks → visual isyarat: cari peragaan dari kamus backend (GET /dictionary?search=).
 */
export async function textToSign(
  text: string,
  signLanguageType: SignLanguageType = 'bisindo'
): Promise<TextToSignResult> {
  const cleanText = text.trim();

  if (!cleanText) {
    return {
      visualUrl: '',
      description: 'Visual bahasa isyarat akan tampil di sini.',
    };
  }

  const matches = await searchDictionary(cleanText);
  const match = matches.find((entry) => entry.type === signLanguageType) ?? matches[0];

  if (match) {
    return {
      visualUrl: match.videoUrl || match.imageUrl,
      description: match.description || `Peragaan isyarat untuk “${match.word}”.`,
    };
  }

  return {
    visualUrl: '',
    description: `Belum ada peragaan untuk “${cleanText}” di kamus. Coba kata lain.`,
  };
}
