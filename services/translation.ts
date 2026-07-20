import type { SignLanguageType } from '../types';
import { apiRequest, apiUpload, resolveApiUrl } from './api';

export type SignMediaType = 'video' | 'image';
export type SignMatchType = 'exact' | 'spelling';

export interface TextToSignUnit {
  token: string;
  word: string;
  category: string;
  description: string;
  videoUrl: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: SignMediaType;
  matchType: SignMatchType;
}

export interface TextToSignResult {
  text: string;
  signLanguageType: SignLanguageType;
  units: TextToSignUnit[];
  unmatched: string[];
}

export interface RecognitionCandidate {
  label: string;
  confidence: number;
}

export interface SignRecognitionResult {
  text: string;
  confidence: number;
  candidates: RecognitionCandidate[];
  mode: 'BISINDO';
  stage: 'abjad' | 'kata';
  model_loaded: boolean;
  note?: string | null;
}

export interface MediaUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  type?: 'image' | 'video' | null;
}

/** Teks → rangkaian media isyarat dari kamus backend. */
export async function textToSign(
  text: string,
  signLanguageType: SignLanguageType = 'bisindo'
): Promise<TextToSignResult> {
  const result = await apiRequest<TextToSignResult>('/translate/text-to-sign', {
    method: 'POST',
    body: { text: text.trim(), signLanguageType },
  });
  return {
    ...result,
    units: result.units.map((unit) => ({
      ...unit,
      imageUrl: resolveApiUrl(unit.imageUrl),
      videoUrl: resolveApiUrl(unit.videoUrl),
      mediaUrl: resolveApiUrl(unit.mediaUrl),
    })),
  };
}

/** Foto/video → teks menggunakan MediaPipe + model backend. */
export async function recognizeMedia(
  media: MediaUpload,
  stage: 'abjad' | 'kata'
): Promise<SignRecognitionResult> {
  const extension = media.uri.split('?')[0].split('.').pop()?.toLowerCase();
  const isVideo = stage === 'kata';
  const name = media.fileName || `isyarat.${extension || (isVideo ? 'mp4' : 'jpg')}`;
  const mimeType = media.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
  const formData = new FormData();
  formData.append('stage', stage);
  formData.append(
    'file',
    { uri: media.uri, name, type: mimeType } as unknown as Blob
  );
  return apiUpload<SignRecognitionResult>('/translate/sign-to-text', formData);
}
