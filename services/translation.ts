import * as VideoThumbnails from 'expo-video-thumbnails';

import type { SignLanguageType } from '../types';
import { apiRequest, apiUpload, resolveApiUrl } from './api';

export type SignMediaType = 'video' | 'image';
export type SignMatchType = 'exact' | 'spelling';

/** Jenis isyarat yang dikenali otomatis dari bentuk label model. */
export type SignKind = 'huruf' | 'angka' | 'kata';

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

export interface AutoRecognitionResult {
  text: string;
  kind: SignKind | null;
  confidence: number;
  candidates: RecognitionCandidate[];
  note?: string | null;
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

/** Batas waktu unggah: video jauh lebih besar daripada satu frame gambar. */
const IMAGE_UPLOAD_TIMEOUT_MS = 60000;
const VIDEO_UPLOAD_TIMEOUT_MS = 120000;

/** Foto/video → teks menggunakan MediaPipe + model backend. */
export async function recognizeMedia(
  media: MediaUpload,
  stage: 'abjad' | 'kata'
): Promise<SignRecognitionResult> {
  const extension = media.uri.split('?')[0].split('.').pop()?.toLowerCase();
  const isVideo = media.type ? media.type === 'video' : stage === 'kata';
  const name = media.fileName || `isyarat.${extension || (isVideo ? 'mp4' : 'jpg')}`;
  const mimeType = media.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
  const formData = new FormData();
  formData.append('stage', stage);
  formData.append(
    'file',
    { uri: media.uri, name, type: mimeType } as unknown as Blob
  );
  return apiUpload<SignRecognitionResult>(
    '/translate/sign-to-text',
    formData,
    { timeoutMs: isVideo ? VIDEO_UPLOAD_TIMEOUT_MS : IMAGE_UPLOAD_TIMEOUT_MS }
  );
}

/**
 * Tebak jenis isyarat dari bentuk label model:
 * satu karakter A–Z → huruf, seluruhnya digit → angka, sisanya kata.
 */
export function classifySignLabel(label: string): SignKind {
  const value = label.trim();
  if (/^[A-Za-z]$/.test(value)) {
    return 'huruf';
  }
  if (/^\d+$/.test(value)) {
    return 'angka';
  }
  return 'kata';
}

export const SIGN_KIND_LABEL: Record<SignKind, string> = {
  huruf: 'Huruf',
  angka: 'Angka',
  kata: 'Kata',
};

/**
 * Ambil satu frame dari video rekaman untuk dikirim ke model abjad
 * (model gambar). `atMs` idealnya di tengah rekaman saat pose ditahan.
 */
async function extractFrame(videoUri: string, atMs: number): Promise<MediaUpload> {
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: Math.max(0, Math.round(atMs)),
    quality: 0.8,
  });
  return { uri, fileName: 'isyarat-frame.jpg', mimeType: 'image/jpeg', type: 'image' };
}

/**
 * Pengenalan otomatis huruf / angka / kata dari satu rekaman video.
 *
 * Backend saat ini belum punya `stage=auto` (lihat docs/BACKEND-AUTO-DETECT.txt),
 * dan model tiap stage mencakup label berbeda:
 * - `kata`  (video)  → label angka & kata
 * - `abjad` (gambar) → label huruf
 *
 * Karena itu aplikasi memanggil keduanya secara paralel lalu memilih kandidat
 * dengan confidence tertinggi. Jika salah satu gagal, hasil yang berhasil tetap
 * dipakai; jika keduanya gagal, error pertama dilempar ulang.
 */
export async function recognizeAuto(
  video: MediaUpload,
  options: { durationMs?: number } = {}
): Promise<AutoRecognitionResult> {
  const frameTime = options.durationMs && options.durationMs > 0 ? options.durationMs / 2 : 700;

  const [sequence, still] = await Promise.allSettled([
    recognizeMedia({ ...video, type: 'video' }, 'kata'),
    extractFrame(video.uri, frameTime).then((frame) => recognizeMedia(frame, 'abjad')),
  ]);

  const results: SignRecognitionResult[] = [];
  if (sequence.status === 'fulfilled') {
    results.push(sequence.value);
  }
  if (still.status === 'fulfilled') {
    results.push(still.value);
  }

  if (results.length === 0) {
    const firstError = [sequence, still].find(
      (item): item is PromiseRejectedResult => item.status === 'rejected'
    );
    throw firstError?.reason instanceof Error
      ? firstError.reason
      : new Error('Pengenalan isyarat gagal. Coba ulangi.');
  }

  const candidates = results
    .flatMap((result) =>
      result.candidates?.length
        ? result.candidates
        : result.text
          ? [{ label: result.text, confidence: result.confidence }]
          : []
    )
    .sort((a, b) => b.confidence - a.confidence);

  // `text` hanya diisi server saat confidence >= ambang minimum, jadi kemunculan
  // `text` dipakai sebagai penanda hasil yang benar-benar layak ditampilkan.
  const accepted = results
    .filter((result) => Boolean(result.text))
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (accepted) {
    return {
      text: accepted.text,
      kind: classifySignLabel(accepted.text),
      confidence: accepted.confidence,
      candidates,
      note: null,
    };
  }

  return {
    text: '',
    kind: null,
    confidence: candidates[0]?.confidence ?? 0,
    candidates,
    note:
      results.find((result) => result.note)?.note ??
      'Isyarat belum dikenali. Tahan gerakan lebih lama dan pastikan pencahayaan cukup.',
  };
}
