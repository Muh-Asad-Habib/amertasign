import * as VideoThumbnails from 'expo-video-thumbnails';

import { isHiddenSignWord } from '../constants/Dictionary';
import type { SignLanguageType } from '../types';
import { ApiError, apiRequest, apiUpload, resolveApiUrl } from './api';

export type SignMediaType = 'video' | 'image';
export type SignMatchType = 'exact' | 'spelling';

/** Karakter peraga media isyarat; mengikuti pilihan gender di Pengaturan. */
export type SignAvatar = 'male' | 'female';

/** Jenis isyarat; kini dikirim server lewat field `kind` (fallback: bentuk label). */
export type SignKind = 'huruf' | 'angka' | 'kata';

/**
 * Nilai `stage` pada POST /translate/sign-to-text:
 * - `abjad` : model huruf A–Z   — hanya gambar/frame
 * - `angka` : model angka 1–19  — hanya gambar/frame
 * - `kata`  : model kata        — hanya video
 * - `auto`  : server memilih sendiri model huruf/angka/kata (gambar & video)
 */
export type RecognitionStage = 'abjad' | 'angka' | 'kata' | 'auto';

/**
 * Mode pengenalan yang dipilih pengguna di layar kamera. Mode menentukan
 * `stage` yang dipakai, bukan lagi sekadar menyaring `candidates[]`:
 *   otomatis → stage=auto (1 request, server yang membedakan jenis)
 *   huruf    → stage=abjad pada frame cuplikan
 *   angka    → stage=angka pada frame cuplikan
 *   kata     → stage=kata pada video penuh
 */
export type RecognitionMode = 'otomatis' | 'huruf' | 'angka' | 'kata';

/** Mode satu-tembak: cukup satu request video, tanpa sampling frame. */
export type SingleShotMode = Extract<RecognitionMode, 'angka' | 'kata'>;

/** Mode isyarat statis: dikenali dari frame diam, bukan dari urutan gerakan. */
export type StaticMode = Extract<RecognitionMode, 'huruf' | 'angka'>;

/** Stage frame diam per mode statis — model angka terpisah dari model huruf. */
export const STATIC_MODE_STAGE: Record<StaticMode, Extract<RecognitionStage, 'abjad' | 'angka'>> = {
  huruf: 'abjad',
  angka: 'angka',
};

export const RECOGNITION_MODE_OPTIONS: Array<{ id: RecognitionMode; label: string }> = [
  { id: 'otomatis', label: 'Otomatis' },
  { id: 'huruf', label: 'Huruf' },
  { id: 'angka', label: 'Angka' },
  { id: 'kata', label: 'Kata' },
];

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
  /** Durasi media (ms) dari server; additive — server lama tidak mengirimnya. */
  durationMs?: number | null;
  /** Peraga yang benar-benar dipakai unit ini (bisa berbeda dari yang diminta). */
  avatar?: SignAvatar;
}

export interface TextToSignResult {
  text: string;
  signLanguageType: SignLanguageType;
  units: TextToSignUnit[];
  unmatched: string[];
  /** Peraga yang dipakai server; additive — server lama tidak mengirimnya. */
  avatar?: SignAvatar;
  avatarRequested?: SignAvatar;
  /** True bila ada unit dialihkan ke peraga lain karena medianya belum ada. */
  avatarFallback?: boolean;
}

export interface RecognitionCandidate {
  label: string;
  confidence: number;
  /** Jenis label menurut server (additive; server lama tidak mengirimnya). */
  kind?: SignKind | null;
}

/** Satu gerakan hasil segmentasi server pada rekaman multi-isyarat (stage=auto). */
export interface RecognitionSegment {
  label: string;
  kind?: SignKind | null;
  confidence: number;
  startMs: number;
  endMs: number;
}

export interface SignRecognitionResult {
  text: string;
  confidence: number;
  candidates: RecognitionCandidate[];
  mode: 'BISINDO';
  stage: RecognitionStage;
  model_loaded: boolean;
  note?: string | null;
  /** Jenis label final dari server; null bila `text` kosong. */
  kind?: SignKind | null;
  /** Rincian gerakan bila rekaman berisi beberapa isyarat berurutan. */
  segments?: RecognitionSegment[] | null;
}

export interface MediaUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  type?: 'image' | 'video' | null;
}

/** Jenis hasil yang bisa ditampilkan: satu isyarat, atau rangkaian beberapa isyarat. */
export type SequenceKind = SignKind | 'rangkai';

/** Satu sampel frame dari video yang sudah diklasifikasi model abjad. */
export interface SequenceSample {
  /** Posisi frame dalam video (ms) — dipakai untuk mengurutkan. */
  timeMs: number;
  /** Label yakin dari server ('' bila di bawah ambang server). */
  label: string;
  confidence: number;
}

/** Satu isyarat yang diterima dalam rangkaian (huruf/angka/kata). */
export interface SequenceToken {
  label: string;
  kind: SignKind;
  confidence: number;
}

export interface SequenceRecognitionResult {
  /** Teks rangkaian penuh, mis. "BUDI" (ejaan) atau "HALO". */
  text: string;
  kind: SequenceKind | null;
  confidence: number;
  /** Isyarat per segmen — untuk chip/rincian di UI. */
  tokens: SequenceToken[];
  candidates: RecognitionCandidate[];
  note?: string | null;
}

/** Teks → rangkaian media isyarat dari kamus backend. */
export async function textToSign(
  text: string,
  signLanguageType: SignLanguageType = 'bisindo',
  avatar?: SignAvatar
): Promise<TextToSignResult> {
  const result = await apiRequest<TextToSignResult>('/translate/text-to-sign', {
    method: 'POST',
    // `avatar` opsional: server fallback ke peraga default bila medianya belum ada.
    body: { text: text.trim(), signLanguageType, ...(avatar ? { avatar } : {}) },
  });
  const units = result.units.map((unit) => ({
    ...unit,
    imageUrl: resolveApiUrl(unit.imageUrl),
    videoUrl: resolveApiUrl(unit.videoUrl),
    mediaUrl: resolveApiUrl(unit.mediaUrl),
  }));
  // SEMENTARA: kata yang disembunyikan (lihat CATATAN di constants/Dictionary.ts)
  // ikut disaring dari hasil terjemahan; token-nya dipindah ke `unmatched` agar
  // UI menampilkan "Karakter belum tersedia". Ejaan per huruf tidak terpengaruh.
  const visibleUnits = units.filter(
    (unit) => !(unit.matchType === 'exact' && isHiddenSignWord(unit.word))
  );
  const hiddenTokens = units
    .filter((unit) => unit.matchType === 'exact' && isHiddenSignWord(unit.word))
    .map((unit) => unit.token);
  return {
    ...result,
    units: visibleUnits,
    unmatched: Array.from(new Set([...result.unmatched, ...hiddenTokens])),
  };
}

/** Batas waktu unggah: video jauh lebih besar daripada satu frame gambar. */
const IMAGE_UPLOAD_TIMEOUT_MS = 60000;
const VIDEO_UPLOAD_TIMEOUT_MS = 120000;

/** Ekstensi video yang dikenali server — dipakai menebak jenis media. */
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];

/** Foto/video → teks menggunakan MediaPipe + model backend. */
export async function recognizeMedia(
  media: MediaUpload,
  stage: RecognitionStage
): Promise<SignRecognitionResult> {
  const extension = media.uri.split('?')[0].split('.').pop()?.toLowerCase();
  const isVideo = media.type
    ? media.type === 'video'
    : extension
      ? VIDEO_EXTENSIONS.includes(extension)
      : stage === 'kata';
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
 * Dipakai hanya sebagai cadangan bila server tidak mengirim `kind`.
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

/** Jenis label: pakai `kind` dari server, jatuh ke tebakan bentuk label. */
export function resolveSignKind(label: string, kind?: SignKind | null): SignKind {
  return kind ?? classifySignLabel(label);
}

export const SIGN_KIND_LABEL: Record<SequenceKind, string> = {
  huruf: 'Huruf',
  angka: 'Angka',
  kata: 'Kata',
  rangkai: 'Rangkaian',
};

/** Label huruf dari model abjad: tepat satu karakter A–Z. */
export function isLetterLabel(label: string): boolean {
  return /^[A-Za-z]$/.test(label.trim());
}

/** Label angka dari model angka: seluruhnya digit (mis. "7", "10"). */
export function isDigitLabel(label: string): boolean {
  return /^\d+$/.test(label.trim());
}

/** Label kata: apa pun yang bukan digit — huruf tunggal ikut ditolak. */
export function isWordLabel(label: string): boolean {
  const value = label.trim();
  return value.length > 0 && !isDigitLabel(value) && !isLetterLabel(value);
}

/** Predikat label per jenis isyarat — dipakai menyaring kandidat per mode. */
export const SIGN_KIND_PREDICATE: Record<SignKind, (label: string) => boolean> = {
  huruf: isLetterLabel,
  angka: isDigitLabel,
  kata: isWordLabel,
};

/** Catatan saat tak satu pun kandidat cocok dengan mode yang dikunci. */
const NO_MATCH_NOTE: Record<Exclude<RecognitionMode, 'otomatis'>, string> = {
  huruf: 'Tidak ada isyarat huruf yang dikenali. Peragakan huruf lebih jelas, atau ganti mode.',
  angka: 'Tidak ada isyarat angka yang dikenali. Peragakan angka lebih jelas, atau ganti mode.',
  kata: 'Tidak ada isyarat kata yang dikenali. Peragakan kata lebih jelas, atau ganti mode.',
};

/**
 * Ambil satu frame dari video rekaman untuk dikirim ke model abjad
 * (model gambar). `atMs` idealnya saat pose sedang ditahan.
 */
async function extractFrame(videoUri: string, atMs: number): Promise<MediaUpload> {
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: Math.max(0, Math.round(atMs)),
    quality: 0.8,
  });
  return { uri, fileName: 'isyarat-frame.jpg', mimeType: 'image/jpeg', type: 'image' };
}

/**
 * ============================================================================
 * PIPELINE RANGKAIAN ISYARAT — beberapa isyarat dalam SATU rekaman.
 *
 * Mode Otomatis kini cukup SATU request `stage=auto`: server menjalankan model
 * huruf + angka + kata, menyegmentasi rekaman multi-isyarat sendiri, dan
 * mengirim rinciannya lewat `segments[]` (lihat docs/API-SPEC.md).
 *
 * Mode statis (Huruf/Angka) tetap memakai cuplikan frame di perangkat, karena
 * `stage=abjad`/`stage=angka` hanya menerima gambar:
 * 1. Cuplik banyak frame dari video → kirim tiap frame ke stage terkait.
 * 2. Rakit timeline label: label yang stabil beberapa sampel berurutan =
 *    isyarat yang ditahan; label yang cuma muncul sekali = frame transisi
 *    antar isyarat (dibuang).
 *
 * Pipeline lama (video ke model kata + frame ke model abjad lalu digabung
 * mergeSequenceResult) dipertahankan sebagai CADANGAN untuk server yang belum
 * mengenal `stage=auto`.
 * ============================================================================
 */

/** Konstanta tuning pipeline rangkaian — setel di sini setelah uji lapangan. */
export const SEQUENCE_TUNING = {
  /** Jarak ideal antar frame cuplikan (ms). Isyarat ditahan ±2 dtk → ±2 sampel. */
  frameIntervalMs: 900,
  /** Lewati bagian paling awal video (pengguna baru mengangkat tangan). */
  leadInMs: 350,
  /** Lewati bagian paling akhir video (tangan turun menjelang stop). */
  tailMs: 250,
  /** Batas frame per terjemahan — menjaga beban server (PERUBAHAN-SERVER.txt poin 7). */
  maxFrames: 12,
  /** Maksimal request frame berjalan bersamaan. */
  frameConcurrency: 3,
  /** Confidence minimum sebuah sampel agar ikut dirakit. */
  minSampleConfidence: 0.5,
  /** Sampel identik berurutan minimum agar satu isyarat dianggap stabil. */
  minStableSamples: 2,
  /** Jumlah token ejaan agar rangkaian menang mutlak atas hasil kata. */
  spellingWinsAt: 4,
  /** Confidence kata minimum untuk mengalahkan ejaan 3 token. */
  wordBeatsSpellingConfidence: 0.85,
  /** Confidence minimum kandidat hasil penyaringan mode agar layak ditampilkan. */
  minFilteredConfidence: 0.25,
} as const;

export type SequenceTuning = typeof SEQUENCE_TUNING;

/**
 * Pilih kandidat terbaik yang lolos predikat mode.
 *
 * Label teratas (`text`) didahulukan bila sudah cocok; kalau tidak, `candidates`
 * ditelusuri menurun (diurutkan defensif karena urutan server tidak dijamin).
 * Kandidat di bawah `minFilteredConfidence` diabaikan — menampilkan tebakan
 * lemah lebih buruk daripada mengaku belum mengenali.
 * (Fungsi murni — diuji unit test.)
 */
export function pickCandidate(
  result: SignRecognitionResult | null,
  predicate: (label: string) => boolean,
  tuning: SequenceTuning = SEQUENCE_TUNING
): RecognitionCandidate | null {
  if (!result) {
    return null;
  }

  const text = result.text?.trim() ?? '';
  const confidence = result.confidence ?? 0;
  if (text && predicate(text) && confidence >= tuning.minFilteredConfidence) {
    return { label: text, confidence };
  }

  const ranked = [...(result.candidates ?? [])].sort((a, b) => b.confidence - a.confidence);
  for (const candidate of ranked) {
    const label = candidate.label?.trim() ?? '';
    if (label && predicate(label) && candidate.confidence >= tuning.minFilteredConfidence) {
      return { label, confidence: candidate.confidence };
    }
  }

  return null;
}

/**
 * Bungkus hasil satu-tembak (mode angka/kata) menjadi bentuk rangkaian supaya
 * layar kamera hanya perlu menangani satu tipe hasil.
 * (Fungsi murni — diuji unit test.)
 */
export function resolveSingleShotResult(
  result: SignRecognitionResult | null,
  mode: SingleShotMode,
  tuning: SequenceTuning = SEQUENCE_TUNING
): SequenceRecognitionResult {
  const candidates = sortCandidates(result?.candidates);
  const picked = pickCandidate(result, SIGN_KIND_PREDICATE[mode], tuning);

  if (!picked) {
    return {
      text: '',
      kind: null,
      confidence: candidates[0]?.confidence ?? 0,
      tokens: [],
      candidates,
      note: result?.note ?? NO_MATCH_NOTE[mode],
    };
  }

  const label = picked.label.toUpperCase();
  return {
    text: label,
    kind: mode,
    confidence: picked.confidence,
    tokens: [{ label, kind: mode, confidence: picked.confidence }],
    candidates,
    note: null,
  };
}

/** Salin kandidat lalu urutkan menurun — urutan dari server tidak dijamin. */
function sortCandidates(candidates?: RecognitionCandidate[] | null): RecognitionCandidate[] {
  return [...(candidates ?? [])].sort((a, b) => b.confidence - a.confidence);
}

/** Gabungkan kandidat dari banyak frame: satu baris per label, ambil terbaik. */
function dedupeCandidates(candidates: RecognitionCandidate[], limit = 5): RecognitionCandidate[] {
  const best = new Map<string, RecognitionCandidate>();
  for (const candidate of candidates) {
    const label = candidate.label?.trim() ?? '';
    if (!label) {
      continue;
    }
    const current = best.get(label);
    if (!current || candidate.confidence > current.confidence) {
      best.set(label, { ...candidate, label });
    }
  }
  return sortCandidates([...best.values()]).slice(0, limit);
}

/**
 * Terjemahkan hasil `stage=auto` menjadi bentuk rangkaian yang dipakai UI.
 *
 * Server sudah menentukan jenis (`kind`) dan, untuk rekaman multi-isyarat,
 * memecahnya di `segments[]` sekaligus menyambungkan teksnya. Klien hanya
 * memetakan ulang tanpa menebak-nebak lagi.
 * (Fungsi murni — diuji unit test.)
 */
export function resolveAutoResult(
  result: SignRecognitionResult | null
): SequenceRecognitionResult {
  const candidates = sortCandidates(result?.candidates);
  const text = result?.text?.trim() ?? '';
  const tokens: SequenceToken[] = (result?.segments ?? [])
    .map((segment) => ({
      label: (segment.label ?? '').trim().toUpperCase(),
      kind: resolveSignKind(segment.label ?? '', segment.kind),
      confidence: segment.confidence ?? 0,
    }))
    .filter((token) => token.label.length > 0);

  if (!text && tokens.length === 0) {
    return {
      text: '',
      kind: null,
      confidence: candidates[0]?.confidence ?? 0,
      tokens: [],
      candidates,
      note: result?.note ?? EMPTY_SEQUENCE_NOTE,
    };
  }

  if (tokens.length === 0) {
    const label = text.toUpperCase();
    const kind = resolveSignKind(text, result?.kind);
    const confidence = result?.confidence ?? 0;
    return {
      text: label,
      kind,
      confidence,
      tokens: [{ label, kind, confidence }],
      candidates,
      note: null,
    };
  }

  return {
    text: (text || joinSequenceTokens(tokens)).toUpperCase(),
    kind: tokens.length > 1 ? 'rangkai' : tokens[0].kind,
    confidence: result?.confidence ?? Math.min(...tokens.map((token) => token.confidence)),
    tokens,
    candidates,
    note: null,
  };
}

/**
 * Susun hasil jalur frame statis (mode Huruf/Angka) dari token yang sudah
 * dirakit assembleSignTimeline.
 * (Fungsi murni — diuji unit test.)
 */
export function resolveStaticFramesResult(
  tokens: SequenceToken[],
  candidates: RecognitionCandidate[],
  mode: StaticMode
): SequenceRecognitionResult {
  const ranked = dedupeCandidates(candidates);

  if (tokens.length === 0) {
    return {
      text: '',
      kind: null,
      confidence: ranked[0]?.confidence ?? 0,
      tokens: [],
      candidates: ranked,
      note: NO_MATCH_NOTE[mode],
    };
  }

  return {
    text: joinSequenceTokens(tokens),
    kind: tokens.length > 1 ? 'rangkai' : tokens[0].kind,
    confidence: Math.min(...tokens.map((token) => token.confidence)),
    tokens,
    candidates: ranked,
    note: null,
  };
}

/**
 * Rencanakan titik waktu pengambilan frame: merata di dalam rentang berguna
 * video, interval minimal frameIntervalMs, jumlah dibatasi maxFrames.
 * (Fungsi murni — diuji unit test.)
 */
export function planFrameTimes(durationMs: number, tuning: SequenceTuning = SEQUENCE_TUNING): number[] {
  const safeDuration = durationMs > 0 ? durationMs : 3000;
  const start = Math.min(tuning.leadInMs, safeDuration / 2);
  const end = Math.max(start, safeDuration - tuning.tailMs);
  const span = end - start;

  if (span <= 0) {
    return [Math.round(safeDuration / 2)];
  }

  const count = Math.max(1, Math.min(tuning.maxFrames, Math.floor(span / tuning.frameIntervalMs) + 1));
  if (count === 1) {
    return [Math.round(start + span / 2)];
  }

  const step = span / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(start + index * step));
}

/**
 * Rakit timeline sampel frame menjadi daftar isyarat stabil.
 * - Sampel di bawah ambang confidence atau tanpa label = "tak dikenal"
 *   (memutus deretan — biasanya frame transisi antar isyarat).
 * - Sebuah label diterima hanya bila muncul >= minStableSamples berurutan.
 * - Deretan sah yang bersebelahan dengan label sama digabung jadi satu token
 *   (huruf ganda sengaja tidak dibedakan — perlu segmentasi server).
 * (Fungsi murni — diuji unit test.)
 */
export function assembleSignTimeline(
  samples: SequenceSample[],
  tuning: SequenceTuning = SEQUENCE_TUNING
): SequenceToken[] {
  const ordered = [...samples].sort((a, b) => a.timeMs - b.timeMs);

  interface Run {
    label: string;
    confidences: number[];
  }

  // Kelompokkan sampel dikenal menjadi deretan label identik berurutan.
  const runs: (Run | null)[] = [];
  for (const sample of ordered) {
    const label = sample.label.trim().toUpperCase();
    const known = label.length > 0 && sample.confidence >= tuning.minSampleConfidence;

    if (!known) {
      runs.push(null); // pemutus deretan (frame transisi / tak dikenal)
      continue;
    }

    const last = runs[runs.length - 1];
    if (last && last.label === label) {
      last.confidences.push(sample.confidence);
    } else {
      runs.push({ label, confidences: [sample.confidence] });
    }
  }

  // Saring deretan yang tidak stabil, lalu gabungkan tetangga berlabel sama.
  const tokens: SequenceToken[] = [];
  for (const run of runs) {
    if (!run || run.confidences.length < tuning.minStableSamples) {
      continue;
    }

    const confidence =
      run.confidences.reduce((sum, value) => sum + value, 0) / run.confidences.length;
    const previous = tokens[tokens.length - 1];
    if (previous && previous.label === run.label) {
      previous.confidence = Math.max(previous.confidence, confidence);
      continue;
    }

    tokens.push({ label: run.label, kind: classifySignLabel(run.label), confidence });
  }

  return tokens;
}

/** Susun teks dari token: huruf berurutan dieja rapat, selain itu dipisah spasi. */
export function joinSequenceTokens(tokens: SequenceToken[]): string {
  let text = '';
  tokens.forEach((token, index) => {
    if (index === 0) {
      text = token.label;
      return;
    }
    const previous = tokens[index - 1];
    const joinTight = previous.kind === 'huruf' && token.kind === 'huruf';
    text += joinTight ? token.label : ` ${token.label}`;
  });
  return text;
}

const EMPTY_SEQUENCE_NOTE =
  'Isyarat belum dikenali. Tahan tiap isyarat sekitar 2 detik dan pastikan pencahayaan cukup.';

/**
 * Gabungkan rangkaian ejaan (frame) dengan hasil model kata (video penuh):
 * - >= spellingWinsAt token       → rangkaian ejaan menang mutlak.
 * - Tepat spellingWinsAt-1 token  → ejaan menang, kecuali kata sangat yakin.
 * - Token lebih sedikit & ada kata → confidence tertinggi menang (perilaku lama).
 * - Tanpa kata                    → tampilkan rangkaian apa adanya.
 * (Fungsi murni — diuji unit test.)
 */
export function mergeSequenceResult(
  tokens: SequenceToken[],
  word: SignRecognitionResult | null,
  tuning: SequenceTuning = SEQUENCE_TUNING
): SequenceRecognitionResult {
  const wordLabel = word?.text?.trim().toUpperCase() ?? '';
  const wordToken: SequenceToken | null = wordLabel
    ? { label: wordLabel, kind: classifySignLabel(wordLabel), confidence: word?.confidence ?? 0 }
    : null;

  const candidates: RecognitionCandidate[] = [
    ...tokens.map((token) => ({ label: token.label, confidence: token.confidence })),
    ...(word?.candidates ?? []),
  ].sort((a, b) => b.confidence - a.confidence);

  const sequenceResult = (): SequenceRecognitionResult => ({
    text: joinSequenceTokens(tokens),
    kind: tokens.length > 1 ? 'rangkai' : tokens[0].kind,
    confidence: Math.min(...tokens.map((token) => token.confidence)),
    tokens,
    candidates,
    note: null,
  });

  const wordResult = (): SequenceRecognitionResult => ({
    text: wordToken!.label,
    kind: wordToken!.kind,
    confidence: wordToken!.confidence,
    tokens: [wordToken!],
    candidates,
    note: null,
  });

  if (tokens.length >= tuning.spellingWinsAt) {
    return sequenceResult();
  }

  if (tokens.length === tuning.spellingWinsAt - 1) {
    return wordToken && wordToken.confidence >= tuning.wordBeatsSpellingConfidence
      ? wordResult()
      : sequenceResult();
  }

  if (tokens.length > 0 && wordToken) {
    const bestTokenConfidence = Math.max(...tokens.map((token) => token.confidence));
    return wordToken.confidence >= bestTokenConfidence ? wordResult() : sequenceResult();
  }

  if (tokens.length > 0) {
    return sequenceResult();
  }

  if (wordToken) {
    return wordResult();
  }

  return {
    text: '',
    kind: null,
    confidence: candidates[0]?.confidence ?? 0,
    tokens: [],
    candidates,
    note: word?.note ?? EMPTY_SEQUENCE_NOTE,
  };
}

/** Jalankan tugas dengan batas jumlah yang berjalan bersamaan. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Kenali RANGKAIAN isyarat (beberapa huruf/angka + kata) dari satu video.
 *
 * `mode` mengunci jalur yang dipakai (lihat RecognitionMode):
 * - 'otomatis' → 1 request `stage=auto`; server memilih model huruf/angka/kata
 *                dan menyegmentasi rekaman multi-isyarat sendiri.
 * - 'huruf'    → cuplikan frame → `stage=abjad`.
 * - 'angka'    → cuplikan frame → `stage=angka` (model angka terpisah).
 * - 'kata'     → 1 request video → `stage=kata`.
 */
export async function recognizeSequence(
  video: MediaUpload,
  options: { durationMs?: number; mode?: RecognitionMode } = {}
): Promise<SequenceRecognitionResult> {
  const mode = options.mode ?? 'otomatis';

  if (mode === 'kata') {
    const result = await recognizeMedia({ ...video, type: 'video' }, 'kata');
    return resolveSingleShotResult(result, mode);
  }

  if (mode === 'huruf' || mode === 'angka') {
    return recognizeStaticFrames(video, mode, options.durationMs ?? 0);
  }

  try {
    const result = await recognizeMedia({ ...video, type: 'video' }, 'auto');
    return resolveAutoResult(result);
  } catch (error) {
    // Server lama belum mengenal stage=auto → pakai pipeline gabungan lama.
    if (!isUnsupportedStageError(error)) {
      throw error;
    }
    return recognizeSequenceLegacy(video, options.durationMs ?? 0);
  }
}

/** True bila server menolak nilai `stage` (mis. belum mendukung "auto"). */
function isUnsupportedStageError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 422 || error.code === 'VALIDATION_ERROR')
  );
}

/**
 * Mode statis (Huruf/Angka): cuplik beberapa frame diam dari rekaman lalu
 * kirim ke model frame terkait. Label yang tidak sesuai jenis mode dibuang
 * sebelum timeline dirakit, sehingga tebakan berjenis salah tidak ikut tampil.
 */
async function recognizeStaticFrames(
  video: MediaUpload,
  mode: StaticMode,
  durationMs: number
): Promise<SequenceRecognitionResult> {
  const stage = STATIC_MODE_STAGE[mode];
  const predicate = SIGN_KIND_PREDICATE[mode];
  const frameTimes = planFrameTimes(durationMs);
  const frameErrors: unknown[] = [];
  const candidates: RecognitionCandidate[] = [];

  const samples = await mapWithConcurrency(
    frameTimes,
    SEQUENCE_TUNING.frameConcurrency,
    async (timeMs) => {
      try {
        const frame = await extractFrame(video.uri, timeMs);
        const result = await recognizeMedia(frame, stage);
        candidates.push(...(result.candidates ?? []));
        const picked = pickCandidate(result, predicate);
        return { timeMs, label: picked?.label ?? '', confidence: picked?.confidence ?? 0 };
      } catch (error) {
        // Satu frame gagal tidak boleh menggagalkan seluruh terjemahan.
        frameErrors.push(error);
        return { timeMs, label: '', confidence: 0 };
      }
    }
  );

  // Tanpa jalur cadangan: semua frame gagal = kegagalan total.
  if (frameErrors.length === frameTimes.length) {
    const reason = frameErrors[0];
    throw reason instanceof Error ? reason : new Error('Pengenalan isyarat gagal. Coba ulangi.');
  }

  return resolveStaticFramesResult(assembleSignTimeline(samples), candidates, mode);
}

/**
 * Cadangan untuk server tanpa `stage=auto`: video penuh ke model kata dan
 * cuplikan frame ke model abjad, lalu digabung heuristik mergeSequenceResult.
 */
async function recognizeSequenceLegacy(
  video: MediaUpload,
  durationMs: number
): Promise<SequenceRecognitionResult> {
  const frameTimes = planFrameTimes(durationMs);
  const frameErrors: unknown[] = [];

  const [wordSettled, samples] = await Promise.all([
    recognizeMedia({ ...video, type: 'video' }, 'kata').then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason })
    ),
    mapWithConcurrency(frameTimes, SEQUENCE_TUNING.frameConcurrency, async (timeMs) => {
      try {
        const frame = await extractFrame(video.uri, timeMs);
        const result = await recognizeMedia(frame, 'abjad');
        return { timeMs, label: result.text ?? '', confidence: result.confidence ?? 0 };
      } catch (error) {
        // Satu frame gagal tidak boleh menggagalkan seluruh terjemahan.
        frameErrors.push(error);
        return { timeMs, label: '', confidence: 0 };
      }
    }),
  ]);

  // Semua jalur gagal total (bukan sekadar "tak dikenali") → lempar error asli.
  if (wordSettled.status === 'rejected' && frameErrors.length === frameTimes.length) {
    throw wordSettled.reason instanceof Error
      ? wordSettled.reason
      : new Error('Pengenalan isyarat gagal. Coba ulangi.');
  }

  const word = wordSettled.status === 'fulfilled' ? wordSettled.value : null;
  return mergeSequenceResult(assembleSignTimeline(samples), word);
}
