import {
  EMPTY_RESET_MS,
  LETTER_COMMIT_MS,
  LiveRecognitionSession,
  MajoritySmoother,
  SEQ_GAP_MS,
  SEQ_MIN_FRAMES,
  SpellingAccumulator,
  toWebSocketUrl,
  WordSegmenter,
  type LiveHand,
  type LiveRecognitionResult,
} from '../liveRecognition';

/** Satu tangan dummy dengan 21 landmark. */
const hand = (): LiveHand => ({
  handedness: 'Right',
  score: 0.98,
  landmarks: Array.from({ length: 21 }, (_, i) => ({ x: i / 21, y: 0.5, z: 0 })),
});

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const staticResult = (text: string, confidence = 0.9): LiveRecognitionResult => ({
  text,
  confidence,
  candidates: text ? [{ label: text, confidence }] : [],
  mode: 'BISINDO',
  stage: 'abjad',
  model_loaded: true,
});

describe('toWebSocketUrl', () => {
  it('mengubah skema http(s) menjadi ws(s)', () => {
    expect(toWebSocketUrl('https://api.contoh.com')).toBe('wss://api.contoh.com');
    expect(toWebSocketUrl('http://10.0.0.2:8000')).toBe('ws://10.0.0.2:8000');
  });
});

describe('WordSegmenter (aturan segmentasi identik web)', () => {
  it('menutup segmen setelah tangan hilang >= SEQ_GAP_MS', () => {
    const seg = new WordSegmenter();
    let t = 1000;
    for (let i = 0; i < 12; i++) {
      expect(seg.feed([hand()], t)).toBeNull();
      t += 50;
    }
    expect(seg.feed([], t)).toBeNull(); // jeda dimulai
    const segment = seg.feed([], t + SEQ_GAP_MS);
    expect(segment).not.toBeNull();
    expect(segment!.length).toBe(12);
    expect(seg.frameCount).toBe(0);
  });

  it('membuang segmen lebih pendek dari SEQ_MIN_FRAMES', () => {
    const seg = new WordSegmenter();
    let t = 1000;
    for (let i = 0; i < SEQ_MIN_FRAMES - 1; i++) {
      seg.feed([hand()], t);
      t += 50;
    }
    seg.feed([], t);
    expect(seg.feed([], t + SEQ_GAP_MS)).toBeNull();
  });

  it('membelah pada batas durasi tanpa membuang frame berjalan', () => {
    const seg = new WordSegmenter();
    let t = 1000;
    let emitted: LiveHand[][] | null = null;
    for (let i = 0; i < 90 && !emitted; i++) {
      emitted = seg.feed([hand()], t);
      t += 50;
    }
    expect(emitted).not.toBeNull();
    expect(emitted!.length).toBeGreaterThanOrEqual(SEQ_MIN_FRAMES);
    // Frame pemicu menjadi awal segmen baru.
    expect(seg.frameCount).toBe(1);
  });

  it('men-throttle penambahan frame (~1 per 50 ms)', () => {
    const seg = new WordSegmenter();
    for (let i = 0; i < 40; i++) {
      seg.feed([hand()], 1000 + i * 10); // 100 fps
    }
    // 400 ms / 50 ms = maksimal ±9 frame, bukan 40.
    expect(seg.frameCount).toBeLessThanOrEqual(9);
  });

  it('jeda singkat < SEQ_GAP_MS tidak menutup segmen', () => {
    const seg = new WordSegmenter();
    let t = 1000;
    for (let i = 0; i < 10; i++) {
      seg.feed([hand()], t);
      t += 50;
    }
    expect(seg.feed([], t)).toBeNull();
    expect(seg.feed([], t + SEQ_GAP_MS - 50)).toBeNull();
    seg.feed([hand()], t + SEQ_GAP_MS - 40); // tangan kembali → jeda batal
    expect(seg.frameCount).toBeGreaterThan(10 - 1);
  });

  it('flush mengembalikan segmen berjalan yang cukup panjang', () => {
    const seg = new WordSegmenter();
    let t = 1000;
    for (let i = 0; i < 10; i++) {
      seg.feed([hand()], t);
      t += 50;
    }
    const segment = seg.flush();
    expect(segment).not.toBeNull();
    expect(segment!.length).toBe(10);
    expect(seg.flush()).toBeNull();
  });
});

describe('MajoritySmoother', () => {
  it('memilih label mayoritas dari jendela terakhir', () => {
    const smoother = new MajoritySmoother();
    smoother.push('A', 0.9);
    smoother.push('A', 0.8);
    smoother.push('B', 0.99);
    smoother.push('A', 0.7);
    const out = smoother.push('B', 0.95);
    // Jendela: A A B A B → A menang (3 vs 2).
    expect(out.text).toBe('A');
    expect(out.confidence).toBeCloseTo((0.9 + 0.8 + 0.7) / 3);
  });
});

describe('SpellingAccumulator', () => {
  it('merangkai label setelah ditahan >= commitMs, sekali per tahanan', () => {
    const acc = new SpellingAccumulator();
    let t = 1000;
    expect(acc.push('A', 0.8, t)).toBeNull();
    expect(acc.push('A', 0.9, t + LETTER_COMMIT_MS - 10)).toBeNull();
    const committed = acc.push('A', 0.7, t + LETTER_COMMIT_MS);
    expect(committed).toEqual({ label: 'A', confidence: 0.9 });
    // Tahanan yang sama tidak dirangkai dua kali.
    expect(acc.push('A', 0.9, t + LETTER_COMMIT_MS * 3)).toBeNull();
  });

  it('ganti label memulai tahanan baru', () => {
    const acc = new SpellingAccumulator();
    acc.push('A', 0.8, 1000);
    expect(acc.push('B', 0.8, 1500)).toBeNull();
    expect(acc.push('B', 0.8, 1500 + LETTER_COMMIT_MS)).toEqual({
      label: 'B',
      confidence: 0.8,
    });
  });

  it('putus deteksi sesaat tidak mereset tahanan', () => {
    const acc = new SpellingAccumulator();
    acc.push('A', 0.8, 1000);
    acc.push(null, 0, 1400); // hilang sebentar (< EMPTY_RESET_MS)
    const committed = acc.push('A', 0.8, 1000 + LETTER_COMMIT_MS);
    expect(committed?.label).toBe('A');
  });

  it('deteksi kosong yang lama mereset tahanan + mengizinkan label sama lagi', () => {
    const acc = new SpellingAccumulator();
    acc.push('A', 0.8, 1000);
    acc.push('A', 0.8, 1000 + LETTER_COMMIT_MS); // commit pertama
    acc.push(null, 0, 3000);
    acc.push(null, 0, 3000 + EMPTY_RESET_MS); // reset
    expect(acc.push('A', 0.8, 4000)).toBeNull(); // tahanan baru dimulai
    expect(acc.push('A', 0.8, 4000 + LETTER_COMMIT_MS)).toEqual({
      label: 'A',
      confidence: 0.8,
    });
  });
});

describe('LiveRecognitionSession — kata (HTTP per segmen)', () => {
  it('mengirim segmen ke /recognize_sequence dan merangkai hasilnya', async () => {
    const bodies: unknown[] = [];
    const fetchFn = jest.fn(async (url: string, init?: RequestInit) => {
      bodies.push({ url, body: JSON.parse(String(init?.body)) });
      return {
        ok: true,
        json: async () => ({ ...staticResult('Halo', 0.88), stage: 'kata' }),
      } as Response;
    }) as unknown as typeof fetch;

    const commits: [string, string, number][] = [];
    const session = new LiveRecognitionSession({
      stage: 'kata',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: null,
      callbacks: {
        onCommit: (label, kind, confidence) => commits.push([label, kind, confidence]),
      },
    });

    let t = 1000;
    for (let i = 0; i < 12; i++) {
      session.handleFrame([hand()], t);
      t += 50;
    }
    session.handleFrame([], t);
    session.handleFrame([], t + SEQ_GAP_MS);
    await flush();
    await flush();

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const call = bodies[0] as { url: string; body: { stage: string; frames: unknown[][] } };
    expect(call.url).toBe('https://api.uji/recognize_sequence');
    expect(call.body.stage).toBe('kata');
    expect(call.body.frames.length).toBe(12);
    expect(commits).toEqual([['Halo', 'kata', 0.88]]);
    await session.stop();
  });

  it('stop() mem-flush segmen berjalan agar gestur terakhir tidak hilang', async () => {
    const fetchFn = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ...staticResult('Makan', 0.8), stage: 'kata' }),
    })) as unknown as typeof fetch;

    const commits: string[] = [];
    const session = new LiveRecognitionSession({
      stage: 'kata',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: null,
      callbacks: { onCommit: (label) => commits.push(label) },
    });

    let t = 1000;
    for (let i = 0; i < 10; i++) {
      session.handleFrame([hand()], t);
      t += 50;
    }
    await session.stop(); // tanpa jeda tangan — segmen masih di buffer
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(commits).toEqual(['Makan']);
  });

  it('segmen gagal terkirim memicu onNote, bukan crash', async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const notes: string[] = [];
    const session = new LiveRecognitionSession({
      stage: 'kata',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: null,
      callbacks: { onNote: (note) => notes.push(note) },
    });
    let t = 1000;
    for (let i = 0; i < 10; i++) {
      session.handleFrame([hand()], t);
      t += 50;
    }
    session.handleFrame([], t);
    session.handleFrame([], t + SEQ_GAP_MS);
    await flush();
    await flush();
    expect(notes.length).toBe(1);
    await session.stop();
  });
});

describe('LiveRecognitionSession — statis (fallback HTTP)', () => {
  it('tanpa WebSocket: frame dikirim via POST /recognize dan dirangkai jadi ejaan', async () => {
    let fakeNow = 100000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fakeNow);

    const urls: string[] = [];
    const fetchFn = jest.fn(async (url: string) => {
      urls.push(url);
      return { ok: true, json: async () => staticResult('A', 0.9) } as Response;
    }) as unknown as typeof fetch;

    const commits: [string, string][] = [];
    const live: string[] = [];
    const session = new LiveRecognitionSession({
      stage: 'abjad',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: null,
      callbacks: {
        onCommit: (label, kind) => commits.push([label, kind]),
        onLive: (text) => live.push(text),
      },
    });

    let t = 1000;
    for (let i = 0; i < 9; i++) {
      session.handleFrame([hand()], t);
      await flush();
      t += 200; // di atas throttle HTTP
      fakeNow += 200;
    }

    expect(urls.every((url) => url === 'https://api.uji/recognize')).toBe(true);
    expect(live.length).toBeGreaterThan(0);
    expect(live[live.length - 1]).toBe('A');
    // 9 frame x 200 ms = 1,8 dtk > LETTER_COMMIT_MS → 'A' dirangkai sekali.
    expect(commits).toEqual([['A', 'huruf']]);

    await session.stop();
    nowSpy.mockRestore();
  });

  it('throttle HTTP: frame beruntun sangat cepat tidak membanjiri server', async () => {
    const fetchFn = jest.fn(async () => ({
      ok: true,
      json: async () => staticResult('B', 0.9),
    })) as unknown as typeof fetch;
    const session = new LiveRecognitionSession({
      stage: 'angka',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: null,
    });
    for (let i = 0; i < 30; i++) {
      session.handleFrame([hand()], 1000 + i * 16); // ±60 fps
    }
    await flush();
    // 480 ms rentang / 180 ms throttle → maksimal 3-4 request.
    expect((fetchFn as jest.Mock).mock.calls.length).toBeLessThanOrEqual(4);
    await session.stop();
  });
});

describe('LiveRecognitionSession — statis (WebSocket)', () => {
  interface FakeWs {
    readyState: number;
    sent: string[];
    onopen: (() => void) | null;
    onmessage: ((event: { data: unknown }) => void) | null;
    onerror: (() => void) | null;
    onclose: (() => void) | null;
    send(data: string): void;
    close(): void;
  }

  const makeFakeWs = (): FakeWs => ({
    readyState: 0,
    sent: [],
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send(data: string) {
      this.sent.push(data);
    },
    close() {
      this.readyState = 3;
    },
  });

  it('mengirim frame lewat WS dan meneruskan hasil ke onLive', async () => {
    const ws = makeFakeWs();
    const transports: string[] = [];
    const live: string[] = [];
    const session = new LiveRecognitionSession({
      stage: 'abjad',
      baseUrl: 'https://api.uji',
      fetchFn: jest.fn() as unknown as typeof fetch,
      wsFactory: () => ws as unknown as WebSocket,
      callbacks: {
        onTransport: (transport) => transports.push(transport),
        onLive: (text) => live.push(text),
      },
    });

    ws.readyState = 1;
    ws.onopen?.();
    expect(transports).toContain('ws');

    session.handleFrame([hand()], 1000);
    expect(ws.sent.length).toBe(1);
    const payload = JSON.parse(ws.sent[0]);
    expect(payload.stage).toBe('abjad');
    expect(payload.hands.length).toBe(1);

    ws.onmessage?.({ data: JSON.stringify(staticResult('C', 0.95)) });
    expect(live[live.length - 1]).toBe('C');
    await session.stop();
  });

  it('WS gagal → fallback ke HTTP tanpa kehilangan sesi', async () => {
    const ws = makeFakeWs();
    const transports: string[] = [];
    const fetchFn = jest.fn(async () => ({
      ok: true,
      json: async () => staticResult('D', 0.9),
    })) as unknown as typeof fetch;
    const session = new LiveRecognitionSession({
      stage: 'abjad',
      baseUrl: 'https://api.uji',
      fetchFn,
      wsFactory: () => ws as unknown as WebSocket,
      callbacks: { onTransport: (transport) => transports.push(transport) },
    });

    ws.onerror?.(); // koneksi gagal
    expect(transports).toContain('http');

    session.handleFrame([hand()], 5000);
    await flush();
    expect(fetchFn).toHaveBeenCalled();
    await session.stop();
  });
});
