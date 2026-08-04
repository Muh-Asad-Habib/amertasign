import {
  assembleSignTimeline,
  classifySignLabel,
  isDigitLabel,
  isLetterLabel,
  isWordLabel,
  joinSequenceTokens,
  mergeSequenceResult,
  pickCandidate,
  planFrameTimes,
  resolveSingleShotResult,
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

describe('predikat label mode', () => {
  it('isLetterLabel hanya menerima satu karakter A-Z', () => {
    expect(isLetterLabel('A')).toBe(true);
    expect(isLetterLabel(' z ')).toBe(true);
    expect(isLetterLabel('AB')).toBe(false);
    expect(isLetterLabel('1')).toBe(false);
    expect(isLetterLabel('')).toBe(false);
  });

  it('isDigitLabel hanya menerima digit', () => {
    expect(isDigitLabel('7')).toBe(true);
    expect(isDigitLabel('10')).toBe(true);
    expect(isDigitLabel('A')).toBe(false);
    expect(isDigitLabel('kelas 1')).toBe(false);
  });

  it('isWordLabel menolak digit dan huruf tunggal', () => {
    expect(isWordLabel('Mereka')).toBe(true);
    expect(isWordLabel('terima kasih')).toBe(true);
    expect(isWordLabel('10')).toBe(false);
    expect(isWordLabel('A')).toBe(false);
    expect(isWordLabel('  ')).toBe(false);
  });
});

/** Helper: hasil server dengan daftar kandidat lengkap. */
const withCandidates = (
  text: string,
  confidence: number,
  candidates: Array<[string, number]>
): SignRecognitionResult => ({
  text,
  confidence,
  candidates: candidates.map(([label, value]) => ({ label, confidence: value })),
  mode: 'BISINDO',
  stage: 'kata',
  model_loaded: true,
  note: null,
});

describe('pickCandidate', () => {
  it('memakai label teratas bila sudah cocok predikat', () => {
    const result = withCandidates('Mereka', 0.8, [['Mereka', 0.8], ['10', 0.2]]);
    expect(pickCandidate(result, isWordLabel)).toEqual({ label: 'Mereka', confidence: 0.8 });
  });

  // Kasus nyata dari docs/BACKEND-AUTO-DETECT.txt poin (b): kelas angka
  // mendominasi kandidat teratas dan mengalahkan kelas kata.
  it('melewati label digit dan mengambil kandidat kata terbaik', () => {
    const result = withCandidates('10', 0.62, [
      ['10', 0.62],
      ['3', 0.18],
      ['Mereka', 0.31],
      ['Makan', 0.27],
    ]);
    expect(pickCandidate(result, isWordLabel)).toEqual({ label: 'Mereka', confidence: 0.31 });
  });

  it('mode angka tetap mengambil digit meski kata menang di puncak', () => {
    const result = withCandidates('Mereka', 0.7, [['Mereka', 0.7], ['10', 0.29]]);
    expect(pickCandidate(result, isDigitLabel)).toEqual({ label: '10', confidence: 0.29 });
  });

  it('mengurutkan kandidat yang datang tidak terurut', () => {
    const result = withCandidates('10', 0.62, [
      ['Makan', 0.27],
      ['Mereka', 0.31],
      ['10', 0.62],
    ]);
    expect(pickCandidate(result, isWordLabel)?.label).toBe('Mereka');
  });

  it('menolak kandidat di bawah ambang minFilteredConfidence', () => {
    const result = withCandidates('10', 0.9, [['10', 0.9], ['Mereka', 0.1]]);
    expect(result.candidates[1].confidence).toBeLessThan(SEQUENCE_TUNING.minFilteredConfidence);
    expect(pickCandidate(result, isWordLabel)).toBeNull();
  });

  it('hasil kosong atau null aman', () => {
    expect(pickCandidate(null, isWordLabel)).toBeNull();
    expect(pickCandidate(withCandidates('', 0, []), isWordLabel)).toBeNull();
  });
});

describe('resolveSingleShotResult', () => {
  it('mode kata membuang label angka dan memakai kandidat kata', () => {
    const result = resolveSingleShotResult(
      withCandidates('10', 0.62, [['10', 0.62], ['Mereka', 0.31]]),
      'kata'
    );
    expect(result.text).toBe('MEREKA');
    expect(result.kind).toBe('kata');
    expect(result.tokens).toEqual([{ label: 'MEREKA', kind: 'kata', confidence: 0.31 }]);
    expect(result.note).toBeNull();
  });

  it('mode angka memakai kandidat digit', () => {
    const result = resolveSingleShotResult(
      withCandidates('Mereka', 0.7, [['Mereka', 0.7], ['10', 0.29]]),
      'angka'
    );
    expect(result.text).toBe('10');
    expect(result.kind).toBe('angka');
  });

  it('tanpa kandidat cocok: catatan, bukan label salah jenis', () => {
    const result = resolveSingleShotResult(
      withCandidates('10', 0.9, [['10', 0.9], ['3', 0.4]]),
      'kata'
    );
    expect(result.text).toBe('');
    expect(result.kind).toBeNull();
    expect(result.note).toBeTruthy();
    // Kandidat mentah tetap dikembalikan untuk keperluan diagnosa.
    expect(result.candidates[0].label).toBe('10');
  });

  it('kandidat dikembalikan terurut menurun', () => {
    const result = resolveSingleShotResult(
      withCandidates('10', 0.62, [['Makan', 0.27], ['10', 0.62], ['Mereka', 0.31]]),
      'kata'
    );
    expect(result.candidates.map((candidate) => candidate.label)).toEqual(['10', 'Mereka', 'Makan']);
  });

  it('hasil server null tetap menghasilkan catatan', () => {
    const result = resolveSingleShotResult(null, 'angka');
    expect(result.text).toBe('');
    expect(result.note).toBeTruthy();
  });
});
