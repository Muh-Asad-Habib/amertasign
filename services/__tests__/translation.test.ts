import {
  assembleSignTimeline,
  classifySignLabel,
  joinSequenceTokens,
  mergeSequenceResult,
  planFrameTimes,
  SEQUENCE_TUNING,
  type SequenceSample,
  type SequenceToken,
  type SignRecognitionResult,
} from '../translation';

describe('classifySignLabel', () => {
  it('mengenali huruf tunggal sebagai huruf', () => {
    expect(classifySignLabel('A')).toBe('huruf');
    expect(classifySignLabel('z')).toBe('huruf');
    expect(classifySignLabel(' B ')).toBe('huruf');
  });

  it('mengenali angka', () => {
    expect(classifySignLabel('7')).toBe('angka');
    expect(classifySignLabel('12')).toBe('angka');
  });

  it('menganggap sisanya sebagai kata', () => {
    expect(classifySignLabel('halo')).toBe('kata');
    expect(classifySignLabel('terima kasih')).toBe('kata');
    expect(classifySignLabel('A1')).toBe('kata');
    expect(classifySignLabel('')).toBe('kata');
  });
});

/** Helper: sampel frame ber-confidence tinggi. */
const sample = (timeMs: number, label: string, confidence = 0.9): SequenceSample => ({
  timeMs,
  label,
  confidence,
});

/** Helper: hasil model kata dari server. */
const wordResult = (text: string, confidence: number): SignRecognitionResult => ({
  text,
  confidence,
  candidates: text ? [{ label: text, confidence }] : [],
  mode: 'BISINDO',
  stage: 'kata',
  model_loaded: true,
  note: null,
});

describe('planFrameTimes', () => {
  it('membatasi jumlah frame pada video panjang', () => {
    const times = planFrameTimes(15000);
    expect(times.length).toBeLessThanOrEqual(SEQUENCE_TUNING.maxFrames);
    expect(times.length).toBeGreaterThan(4);
  });

  it('mengurutkan naik dan berada dalam rentang video', () => {
    const times = planFrameTimes(8000);
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(times[0]).toBeGreaterThanOrEqual(0);
    expect(times[times.length - 1]).toBeLessThanOrEqual(8000);
  });

  it('video sangat pendek tetap menghasilkan minimal satu frame', () => {
    expect(planFrameTimes(400).length).toBeGreaterThanOrEqual(1);
    expect(planFrameTimes(0).length).toBeGreaterThanOrEqual(1);
  });
});

describe('assembleSignTimeline', () => {
  it('merangkai huruf stabil dan membuang frame transisi', () => {
    const tokens = assembleSignTimeline([
      sample(0, 'B'),
      sample(900, 'B'),
      sample(1800, 'X', 0.6), // transisi: hanya 1 sampel → dibuang
      sample(2700, 'U'),
      sample(3600, 'U'),
      sample(4500, 'D'),
      sample(5400, 'D'),
      sample(6300, 'I'),
      sample(7200, 'I'),
    ]);
    expect(tokens.map((token) => token.label)).toEqual(['B', 'U', 'D', 'I']);
  });

  it('membuang sampel di bawah ambang confidence', () => {
    const tokens = assembleSignTimeline([
      sample(0, 'A', 0.3),
      sample(900, 'A', 0.4),
      sample(1800, 'C'),
      sample(2700, 'C'),
    ]);
    expect(tokens.map((token) => token.label)).toEqual(['C']);
  });

  it('label sama yang terputus transisi digabung jadi satu token', () => {
    const tokens = assembleSignTimeline([
      sample(0, 'A'),
      sample(900, 'A'),
      sample(1800, '', 0), // tak dikenal (transisi)
      sample(2700, 'A'),
      sample(3600, 'A'),
    ]);
    expect(tokens.map((token) => token.label)).toEqual(['A']);
  });

  it('sampel tidak berurutan tetap diurutkan berdasarkan waktu', () => {
    const tokens = assembleSignTimeline([
      sample(2700, 'B'),
      sample(0, 'A'),
      sample(3600, 'B'),
      sample(900, 'A'),
    ]);
    expect(tokens.map((token) => token.label)).toEqual(['A', 'B']);
  });

  it('timeline kosong menghasilkan token kosong', () => {
    expect(assembleSignTimeline([])).toEqual([]);
  });
});

describe('joinSequenceTokens', () => {
  const token = (label: string): SequenceToken => ({
    label,
    kind: classifySignLabel(label),
    confidence: 0.9,
  });

  it('huruf berurutan dieja rapat', () => {
    expect(joinSequenceTokens([token('B'), token('U'), token('D'), token('I')])).toBe('BUDI');
  });

  it('angka dan kata dipisah spasi', () => {
    expect(joinSequenceTokens([token('1'), token('2')])).toBe('1 2');
    expect(joinSequenceTokens([token('A'), token('1'), token('B')])).toBe('A 1 B');
  });
});

describe('mergeSequenceResult', () => {
  const letters = (labels: string[]): SequenceToken[] =>
    labels.map((label) => ({ label, kind: 'huruf' as const, confidence: 0.9 }));

  it('ejaan >= 4 huruf mengalahkan kata meski confidence kata tinggi', () => {
    const result = mergeSequenceResult(letters(['B', 'U', 'D', 'I']), wordResult('MAKAN', 0.95));
    expect(result.text).toBe('BUDI');
    expect(result.kind).toBe('rangkai');
    expect(result.tokens).toHaveLength(4);
  });

  it('ejaan 3 huruf kalah hanya oleh kata yang sangat yakin', () => {
    const beaten = mergeSequenceResult(letters(['I', 'B', 'U']), wordResult('MAKAN', 0.9));
    expect(beaten.text).toBe('MAKAN');
    expect(beaten.kind).toBe('kata');

    const wins = mergeSequenceResult(letters(['I', 'B', 'U']), wordResult('MAKAN', 0.7));
    expect(wins.text).toBe('IBU');
    expect(wins.kind).toBe('rangkai');
  });

  it('<= 2 huruf: confidence tertinggi menang (perilaku lama)', () => {
    const word = mergeSequenceResult(letters(['A']), wordResult('HALO', 0.95));
    expect(word.text).toBe('HALO');

    const letter = mergeSequenceResult(
      [{ label: 'A', kind: 'huruf', confidence: 0.97 }],
      wordResult('HALO', 0.8)
    );
    expect(letter.text).toBe('A');
    expect(letter.kind).toBe('huruf');
  });

  it('tanpa hasil kata, rangkaian tampil apa adanya', () => {
    const result = mergeSequenceResult(letters(['A', 'B']), null);
    expect(result.text).toBe('AB');
    expect(result.kind).toBe('rangkai');
  });

  it('satu token tunggal memakai kind aslinya, bukan rangkai', () => {
    const result = mergeSequenceResult(letters(['A']), null);
    expect(result.kind).toBe('huruf');
  });

  it('tanpa token dan tanpa kata → teks kosong dengan catatan', () => {
    const result = mergeSequenceResult([], wordResult('', 0.2));
    expect(result.text).toBe('');
    expect(result.kind).toBeNull();
    expect(result.note).toBeTruthy();
  });
});
