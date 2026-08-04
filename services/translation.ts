import * as VideoThumbnails from 'expo-video-thumbnails';

import type { SignLanguageType } from '../types';
import { apiRequest, apiUpload, resolveApiUrl } from './api';

export type SignMediaType = 'video' | 'image';
export type SignMatchType = 'exact' | 'spelling';

/** Jenis isyarat yang dikenali otomatis dari bentuk label model. */
export type SignKind = 'huruf' | 'angka' | 'kata';

/**
 * Mode pengenalan yang dipilih pengguna di layar kamera.
 *
 * Mengunci mode menyaring `candidates[]` yang sudah dikirim server, sehingga
 * jenis isyarat yang salah tidak bisa menang. Ini penanggulangan sisi aplikasi
 * untuk kelas angka yang mendominasi kelas kata pada model `stage=kata`
 * (lihat docs/BACKEND-AUTO-DETECT.txt poin b) — tanpa perubahan API.
 */
export type RecognitionMode = 'otomatis' | 'huruf' | 'angka' | 'kata';

/** Mode satu-tembak: cukup satu request video, tanpa sampling frame. */
export type SingleShotMode = Extract<RecognitionMode, 'angka' | 'kata'>;

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

/** Label angka dari model kata: seluruhnya digit (mis. "7", "10"). */
export function isDigitLabel(label: string): boolean {
  return /^\d+$/.test(label.trim());
}

/** Label kata: apa pun yang bukan digit — huruf tunggal ikut ditolak. */
export function isWordLabel(label: string): boolean {
  const value = label.trim();
  return value.length > 0 && !isDigitLabel(value) && !isLetterLabel(value);
}

const MODE_PREDICATE: Record<SignKind, (label: string) => boolean> = {
  huruf: isLetterLabel,
  angka: isDigitLabel,
  kata: isWordLabel,
};

/** Catatan saat tak satu pun kandidat cocok dengan mode yang dikunci. */
const NO_MATCH_NOTE: Record<SingleShotMode, string> = {
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
 * Server belum punya segmentasi temporal (stage=auto multi — lihat
 * docs/PERUBAHAN-SERVER.txt poin 14). Solusi sementara di sisi aplikasi:
 * 1. Cuplik banyak frame dari video → klasifikasi tiap frame ke model abjad.
 * 2. Rakit timeline label: label yang stabil beberapa sampel berurutan =
 *    isyarat yang ditahan; label yang cuma muncul sekali = frame transisi
 *    antar isyarat (dibuang).
 * 3. Video penuh tetap dikirim ke model kata (isyarat dinamis) secara paralel.
 * 4. Gabungkan: rangkaian ejaan huruf/angka vs satu kata — pilih yang paling
 *    meyakinkan (aturan di mergeSequenceResult).
 *
 * Keterbatasan yang disengaja: beberapa KATA dinamis dalam satu video belum
 * bisa dipisah di sisi aplikasi — itu butuh segmentasi di server. Begitu
 * stage=auto multi tersedia, fungsi ini tinggal memanggil 1 request.
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
  const candidates = [...(result?.candidates ?? [])].sort((a, b) => b.confidence - a.confidence);
  const picked = pickCandidate(result, MODE_PREDICATE[mode], tuning);

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
 * Kenali RANGKAIAN isyarat (beberapa huruf/angka + satu kata) dari satu video.
 * Menggantikan recognizeAuto: satu isyarat tetap terdeteksi sama baiknya
 * (degradasi anggun), banyak isyarat statis kini dirangkai jadi ejaan.
 *
 * `mode` mengunci jalur yang dipakai (lihat RecognitionMode):
 * - 'angka' / 'kata' → 1 request video saja, kandidat disaring per jenis.
 * - 'huruf'          → sampling frame saja, tanpa request video.
 * - 'otomatis'       → kedua jalur berjalan lalu digabung heuristik.
 */
export async function recognizeSequence(
  video: MediaUpload,
  options: { durationMs?: number; mode?: RecognitionMode } = {}
): Promise<SequenceRecognitionResult> {
  const mode = options.mode ?? 'otomatis';

  // Angka & kata hanya ada di model video — sampling frame tidak berguna di sini.
  if (mode === 'angka' || mode === 'kata') {
    const result = await recognizeMedia({ ...video, type: 'video' }, 'kata');
    return resolveSingleShotResult(result, mode);
  }

  const frameTimes = planFrameTimes(options.durationMs ?? 0);
  const frameErrors: unknown[] = [];

  // Model abjad hanya menerima gambar, jadi mode huruf melewatkan request video.
  const runWordModel = mode === 'otomatis';

  const [wordSettled, samples] = await Promise.all([
    runWordModel
      ? recognizeMedia({ ...video, type: 'video' }, 'kata').then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason) => ({ status: 'rejected' as const, reason })
      )
      : Promise.resolve({ status: 'skipped' as const }),
    mapWithConcurrency(frameTimes, SEQUENCE_TUNING.frameConcurrency, async (timeMs) => {
      try {
        const frame = await extractFrame(video.uri, timeMs);
        const result = await recognizeMedia(frame, 'abjad');
        // Mode huruf menolak label non-huruf sebelum frame ikut dirakit.
        if (mode === 'huruf') {
          const picked = pickCandidate(result, isLetterLabel);
          return { timeMs, label: picked?.label ?? '', confidence: picked?.confidence ?? 0 };
        }
        return { timeMs, label: result.text ?? '', confidence: result.confidence ?? 0 };
      } catch (error) {
        // Satu frame gagal tidak boleh menggagalkan seluruh terjemahan.
        frameErrors.push(error);
        return { timeMs, label: '', confidence: 0 };
      }
    }),
  ]);

  const allFramesFailed = frameErrors.length === frameTimes.length;

  // Semua jalur gagal total (bukan sekadar "tak dikenali") → lempar error asli.
  if (wordSettled.status === 'rejected' && allFramesFailed) {
    throw wordSettled.reason instanceof Error
      ? wordSettled.reason
      : new Error('Pengenalan isyarat gagal. Coba ulangi.');
  }

  // Mode huruf tidak punya jalur cadangan: kegagalan frame = kegagalan total.
  if (wordSettled.status === 'skipped' && allFramesFailed) {
    const reason = frameErrors[0];
    throw reason instanceof Error ? reason : new Error('Pengenalan isyarat gagal. Coba ulangi.');
  }

  const word = wordSettled.status === 'fulfilled' ? wordSettled.value : null;
  const tokens = assembleSignTimeline(samples);
  return mergeSequenceResult(tokens, word);
}
