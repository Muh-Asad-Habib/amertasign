/**
 * Pengenalan isyarat LIVE — port persis pipeline web (SignRecognizer.tsx):
 * landmark tangan dideteksi DI PERANGKAT (MediaPipe dalam WebView), lalu
 * dikirim ke backend sebagai JSON kecil — bukan video. Ini jalur yang sudah
 * terbukti di web; jalur unggah video tetap ada untuk galeri.
 *
 * - Huruf/Angka (statis) : streaming per-frame via WebSocket /ws/recognize
 *                          (throttle 66 ms), fallback otomatis ke POST
 *                          /recognize bila WS gagal. Hasil dihaluskan
 *                          majority-vote lalu dirangkai jadi ejaan.
 * - Kata (dinamis)       : segmentasi BERBASIS WAKTU identik web
 *                          (add 50 ms, maks 4000 ms, jeda 300 ms, min 8
 *                          frame) → POST /recognize_sequence per segmen.
 */

import { API_BASE_URL } from './api';
import type { SignKind } from './translation';

// ── Tipe payload — identik dengan kontrak backend (lib/types.ts di web) ──

export interface LiveLandmark {
  x: number;
  y: number;
  z: number;
}

export interface LiveHand {
  handedness: 'Left' | 'Right';
  score: number;
  /** 21 titik landmark MediaPipe. */
  landmarks: LiveLandmark[];
}

export type LiveStage = 'abjad' | 'angka' | 'kata';

export interface LiveRecognitionResult {
  text: string;
  confidence: number;
  candidates: { label: string; confidence: number }[];
  mode: string;
  stage: string;
  model_loaded: boolean;
  note?: string | null;
  hands_detected?: number | null;
  expected_hands?: number | null;
  hand_hint?: string | null;
}

// ── Konstanta — SAMA dengan web (lib/config.ts + SignRecognizer.tsx) ──

/** Throttle kirim frame statis via WebSocket (~15 fps). */
export const SEND_INTERVAL_MS = 66;
/** Throttle kirim frame statis via HTTP (request penuh lebih mahal dari WS). */
export const HTTP_SEND_INTERVAL_MS = 180;
/** Batas tunggu WS tersambung sebelum jatuh ke HTTP. */
export const WS_CONNECT_TIMEOUT_MS = 2500;

/** Segmen kata minimal dianggap gestur valid. */
export const SEQ_MIN_FRAMES = 8;
/** Throttle penambahan frame segmen kata (~20 fps). */
export const SEQ_ADD_INTERVAL_MS = 50;
/** Durasi maksimum satu segmen kata. */
export const SEQ_MAX_DURATION_MS = 4000;
/** Jeda tangan-hilang yang menutup segmen kata. */
export const SEQ_GAP_MS = 300;

/** Jendela majority-vote hasil statis (anti kedip antar-huruf). */
export const SMOOTH_WINDOW = 5;
/** Lama label statis harus stabil sebelum dirangkai ke ejaan. */
export const LETTER_COMMIT_MS = 1100;
/** Deteksi kosong harus bertahan selama ini sebelum kandidat ejaan direset. */
export const EMPTY_RESET_MS = 350;

// ── Segmenter kata (berbasis waktu; port persis handleFrame web) ──

export class WordSegmenter {
  private buffer: LiveHand[][] = [];
  private startAt = 0;
  private lastAddAt = 0;
  private gapStart: number | null = null;

  /** Jumlah frame pada segmen berjalan (untuk indikator "menangkap"). */
  get frameCount(): number {
    return this.buffer.length;
  }

  reset(): void {
    this.buffer = [];
    this.startAt = 0;
    this.lastAddAt = 0;
    this.gapStart = null;
  }

  /** Ambil segmen berjalan (>= min frame) lalu kosongkan buffer. */
  private takeSegment(): LiveHand[][] | null {
    const frames = this.buffer;
    this.reset();
    return frames.length >= SEQ_MIN_FRAMES ? frames : null;
  }

  /**
   * Umpankan satu frame; kembalikan segmen bila ada yang selesai.
   * `now` = stempel waktu monotonic (ms) dari sumber frame.
   */
  feed(hands: LiveHand[], now: number): LiveHand[][] | null {
    if (hands.length > 0) {
      this.gapStart = null;
      if (this.buffer.length === 0) {
        this.startAt = now;
        this.lastAddAt = 0;
      }
      if (now - this.startAt >= SEQ_MAX_DURATION_MS) {
        // Batas durasi: kenali yang terkumpul; frame ini membuka segmen baru
        // (tidak ada frame terbuang) — perilaku identik web.
        const segment = this.takeSegment();
        this.buffer = [hands];
        this.startAt = now;
        this.lastAddAt = now;
        return segment;
      }
      if (now - this.lastAddAt >= SEQ_ADD_INTERVAL_MS) {
        this.lastAddAt = now;
        this.buffer.push(hands);
      }
      return null;
    }

    if (this.buffer.length > 0) {
      if (this.gapStart === null) {
        this.gapStart = now;
      }
      if (now - this.gapStart >= SEQ_GAP_MS) {
        return this.takeSegment();
      }
    }
    return null;
  }

  /** Finalisasi paksa saat sesi dihentikan di tengah gestur. */
  flush(): LiveHand[][] | null {
    return this.takeSegment();
  }
}

// ── Penghalus hasil statis (majority-vote; port handleStreamResult web) ──

export class MajoritySmoother {
  private buffer: { text: string; confidence: number }[] = [];

  reset(): void {
    this.buffer = [];
  }

  push(text: string, confidence: number): { text: string; confidence: number } {
    this.buffer.push({ text, confidence });
    if (this.buffer.length > SMOOTH_WINDOW) {
      this.buffer.shift();
    }
    const tally = new Map<string, { count: number; confSum: number }>();
    for (const item of this.buffer) {
      const entry = tally.get(item.text) ?? { count: 0, confSum: 0 };
      entry.count += 1;
      entry.confSum += item.confidence;
      tally.set(item.text, entry);
    }
    let bestLabel = text;
    let best = { count: 0, confSum: 0 };
    for (const [label, entry] of tally) {
      if (entry.count > best.count) {
        bestLabel = label;
        best = entry;
      }
    }
    return {
      text: bestLabel,
      confidence: best.count > 0 ? best.confSum / best.count : confidence,
    };
  }
}

// ── Perangkai ejaan: label stabil ±1,1 dtk → dirangkai (huruf/angka) ──

export class SpellingAccumulator {
  private candidate: string | null = null;
  private candidateSince = 0;
  private candidateConf = 0;
  private committedThisHold = false;
  private emptySince: number | null = null;

  constructor(private readonly commitMs: number = LETTER_COMMIT_MS) {}

  reset(): void {
    this.candidate = null;
    this.candidateSince = 0;
    this.candidateConf = 0;
    this.committedThisHold = false;
    this.emptySince = null;
  }

  /**
   * Umpankan label live (null/'' = tak ada deteksi yakin). Kembalikan label
   * saat sudah ditahan cukup lama. Label yang sama tidak dirangkai dua kali
   * dalam satu tahanan — pengguna harus menurunkan tangan / berganti isyarat
   * dulu sebelum huruf yang sama bisa dirangkai lagi. Putus deteksi sesaat
   * (<EMPTY_RESET_MS) tidak mereset tahanan.
   */
  push(label: string | null, confidence: number, now: number): { label: string; confidence: number } | null {
    const value = label?.trim() || null;
    if (!value) {
      if (this.emptySince === null) {
        this.emptySince = now;
      } else if (now - this.emptySince >= EMPTY_RESET_MS) {
        this.candidate = null;
        this.committedThisHold = false;
      }
      return null;
    }
    this.emptySince = null;
    if (value !== this.candidate) {
      this.candidate = value;
      this.candidateSince = now;
      this.candidateConf = confidence;
      this.committedThisHold = false;
      return null;
    }
    this.candidateConf = Math.max(this.candidateConf, confidence);
    if (!this.committedThisHold && now - this.candidateSince >= this.commitMs) {
      this.committedThisHold = true;
      return { label: value, confidence: this.candidateConf };
    }
    return null;
  }
}

// ── Sesi live: orkestrasi transport + pipeline hasil ──

export type LiveTransport = 'ws' | 'http';

export interface LiveSessionCallbacks {
  /** Deteksi live per-frame (huruf/angka setelah majority-vote). */
  onLive?: (text: string, confidence: number, result: LiveRecognitionResult | null) => void;
  /** Token final yang dirangkai (huruf ditahan / kata per segmen). */
  onCommit?: (token: string, kind: SignKind, confidence: number) => void;
  /** Kata: sedang menangkap gerakan (buffer segmen terisi). */
  onCapturing?: (capturing: boolean) => void;
  /** Kata: request segmen sedang diproses server. */
  onProcessing?: (processing: boolean) => void;
  /** Catatan dari server (mis. segmen tidak dikenali). */
  onNote?: (note: string) => void;
  /** Transport aktif berubah (ws → http saat fallback). */
  onTransport?: (transport: LiveTransport) => void;
  /** Kesalahan jaringan beruntun — beri tahu pengguna. */
  onError?: (message: string) => void;
}

export interface LiveSessionOptions {
  stage: LiveStage;
  callbacks?: LiveSessionCallbacks;
  baseUrl?: string;
  /** Injeksi untuk unit test. */
  fetchFn?: typeof fetch;
  wsFactory?: ((url: string) => WebSocket) | null;
}

interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
}

const WS_OPEN = 1;
const MAX_CONSECUTIVE_HTTP_ERRORS = 5;

const KIND_BY_STAGE: Record<LiveStage, SignKind> = {
  abjad: 'huruf',
  angka: 'angka',
  kata: 'kata',
};

/** https://host → wss://host (dan http → ws). */
export function toWebSocketUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/i, 'ws');
}

export class LiveRecognitionSession {
  private readonly stage: LiveStage;
  private readonly callbacks: LiveSessionCallbacks;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly wsFactory: ((url: string) => WebSocketLike) | null;

  private readonly segmenter = new WordSegmenter();
  private readonly smoother = new MajoritySmoother();
  private readonly accumulator = new SpellingAccumulator();

  private ws: WebSocketLike | null = null;
  private wsOpen = false;
  private wsConnectTimer: ReturnType<typeof setTimeout> | null = null;
  private transport: LiveTransport | null = null;

  private lastSendAt = 0;
  private staticInflight = false;
  private sequenceInflight = false;
  private wasCapturing = false;
  private httpErrorStreak = 0;
  private stopped = false;

  constructor(options: LiveSessionOptions) {
    this.stage = options.stage;
    this.callbacks = options.callbacks ?? {};
    this.baseUrl = (options.baseUrl ?? API_BASE_URL).replace(/\/$/, '');
    this.fetchFn = options.fetchFn ?? fetch;

    if (options.wsFactory !== undefined) {
      this.wsFactory = options.wsFactory as ((url: string) => WebSocketLike) | null;
    } else if (typeof WebSocket !== 'undefined') {
      this.wsFactory = (url: string) => new WebSocket(url) as unknown as WebSocketLike;
    } else {
      this.wsFactory = null;
    }

    // Kata memakai HTTP per segmen; statis mencoba WS dulu.
    if (this.stage !== 'kata' && this.wsFactory) {
      this.openSocket();
    } else {
      this.notifyTransport('http');
    }
  }

  private notifyTransport(transport: LiveTransport): void {
    if (this.transport !== transport) {
      this.transport = transport;
      this.callbacks.onTransport?.(transport);
    }
  }

  private openSocket(): void {
    if (!this.wsFactory) {
      this.notifyTransport('http');
      return;
    }
    try {
      const ws = this.wsFactory(`${toWebSocketUrl(this.baseUrl)}/ws/recognize`);
      this.ws = ws;
      this.wsConnectTimer = setTimeout(() => this.fallbackToHttp(), WS_CONNECT_TIMEOUT_MS);
      ws.onopen = () => {
        if (this.wsConnectTimer) {
          clearTimeout(this.wsConnectTimer);
          this.wsConnectTimer = null;
        }
        this.wsOpen = true;
        this.notifyTransport('ws');
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as LiveRecognitionResult & { error?: string };
          if (!data.error) {
            this.handleStaticResult(data);
          }
        } catch {
          /* abaikan payload non-JSON */
        }
      };
      ws.onerror = () => this.fallbackToHttp();
      ws.onclose = () => {
        if (!this.stopped) {
          this.fallbackToHttp();
        }
      };
    } catch {
      this.fallbackToHttp();
    }
  }

  /** WS gagal/putus → lanjutkan sesi lewat HTTP tanpa mengganggu pengguna. */
  private fallbackToHttp(): void {
    if (this.wsConnectTimer) {
      clearTimeout(this.wsConnectTimer);
      this.wsConnectTimer = null;
    }
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* sudah tertutup */
      }
    }
    this.wsOpen = false;
    if (!this.stopped) {
      this.notifyTransport('http');
    }
  }

  /** Pipeline tampilan hasil statis: smoothing → live → rangkai ejaan. */
  private handleStaticResult(result: LiveRecognitionResult): void {
    if (this.stopped) {
      return;
    }
    const now = Date.now();
    if (!result.model_loaded || !result.text) {
      this.smoother.reset();
      this.accumulator.push(null, 0, now);
      this.callbacks.onLive?.('', 0, result);
      return;
    }
    const smoothed = this.smoother.push(result.text, result.confidence);
    this.callbacks.onLive?.(smoothed.text, smoothed.confidence, result);
    const committed = this.accumulator.push(smoothed.text, smoothed.confidence, now);
    if (committed) {
      this.callbacks.onCommit?.(committed.label, KIND_BY_STAGE[this.stage], committed.confidence);
    }
  }

  private async postJson(path: string, body: unknown, timeoutMs: number): Promise<LiveRecognitionResult> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!response.ok) {
        throw new Error(`${path} gagal: ${response.status}`);
      }
      return (await response.json()) as LiveRecognitionResult;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async sendStaticHttp(hands: LiveHand[], now: number): Promise<void> {
    if (this.staticInflight) {
      return;
    }
    this.staticInflight = true;
    try {
      const result = await this.postJson(
        '/recognize',
        { mode: 'BISINDO', stage: this.stage, hands, timestamp: now },
        10000
      );
      this.httpErrorStreak = 0;
      this.handleStaticResult(result);
    } catch {
      this.httpErrorStreak += 1;
      if (this.httpErrorStreak === MAX_CONSECUTIVE_HTTP_ERRORS) {
        this.callbacks.onError?.('Koneksi ke server terputus. Periksa internet lalu coba lagi.');
      }
    } finally {
      this.staticInflight = false;
    }
  }

  /** Kenali satu segmen kata; segmen tumpang-tindih dibuang (perilaku web). */
  private async recognizeSegment(frames: LiveHand[][]): Promise<void> {
    if (this.sequenceInflight) {
      return;
    }
    this.sequenceInflight = true;
    this.callbacks.onProcessing?.(true);
    try {
      const result = await this.postJson(
        '/recognize_sequence',
        { mode: 'BISINDO', stage: 'kata', frames },
        20000
      );
      this.httpErrorStreak = 0;
      if (result.text) {
        this.callbacks.onLive?.(result.text, result.confidence, result);
        this.callbacks.onCommit?.(result.text, 'kata', result.confidence);
      } else if (result.note) {
        this.callbacks.onNote?.(result.note);
      }
    } catch {
      this.httpErrorStreak += 1;
      this.callbacks.onNote?.('Segmen gagal dikirim ke server.');
      if (this.httpErrorStreak === MAX_CONSECUTIVE_HTTP_ERRORS) {
        this.callbacks.onError?.('Koneksi ke server terputus. Periksa internet lalu coba lagi.');
      }
    } finally {
      this.sequenceInflight = false;
      this.callbacks.onProcessing?.(false);
    }
  }

  /**
   * Umpankan satu frame landmark dari tracker.
   * `now` harus monotonic dan konsisten antar-frame (performance.now() page).
   */
  handleFrame(hands: LiveHand[], now: number): void {
    if (this.stopped) {
      return;
    }

    if (this.stage === 'kata') {
      const segment = this.segmenter.feed(hands, now);
      const capturing = this.segmenter.frameCount > 0;
      if (capturing !== this.wasCapturing) {
        this.wasCapturing = capturing;
        this.callbacks.onCapturing?.(capturing);
      }
      if (segment) {
        void this.recognizeSegment(segment);
      }
      return;
    }

    // Statis: throttle sesuai transport.
    const interval = this.wsOpen ? SEND_INTERVAL_MS : HTTP_SEND_INTERVAL_MS;
    if (now - this.lastSendAt < interval) {
      return;
    }
    this.lastSendAt = now;

    if (this.wsOpen && this.ws && this.ws.readyState === WS_OPEN) {
      try {
        this.ws.send(
          JSON.stringify({ mode: 'BISINDO', stage: this.stage, hands, timestamp: now })
        );
      } catch {
        this.fallbackToHttp();
      }
      return;
    }
    void this.sendStaticHttp(hands, now);
  }

  /**
   * Hentikan sesi. Untuk kata: segmen yang masih berjalan difinalisasi dan
   * dikirim dulu (menunggu hasil) supaya gestur terakhir tidak hilang.
   */
  async stop(): Promise<void> {
    if (this.stopped) {
      return;
    }
    if (this.stage === 'kata') {
      if (this.wasCapturing) {
        this.wasCapturing = false;
        this.callbacks.onCapturing?.(false);
      }
      const remainder = this.segmenter.flush();
      if (remainder) {
        // Tunggu request berjalan selesai dulu (guard inflight membuangnya).
        while (this.sequenceInflight) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await this.recognizeSegment(remainder);
      } else {
        while (this.sequenceInflight) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
    this.stopped = true;
    this.fallbackToHttp(); // menutup WS bila masih ada
  }
}
