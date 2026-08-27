import {
  assembleSignTimeline,
  buildSuggestions,
  classifySignLabel,
  isDigitLabel,
  isLetterLabel,
  isWordLabel,
  joinSequenceTokens,
  mergeSequenceResult,
  pickCandidate,
  planFrameTimes,
  resolveAutoResult,
  resolveSignKind,
  resolveSingleShotResult,
  resolveStaticFramesResult,
  SEQUENCE_TUNING,
  STATIC_MODE_STAGE,
  SUGGESTION_LIMIT,
  SUGGESTION_MIN_CONFIDENCE,
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

describe('STATIC_MODE_STAGE', () => {
  it('mode angka memakai model angka terpisah, bukan model kata', () => {
    expect(STATIC_MODE_STAGE.angka).toBe('angka');
    expect(STATIC_MODE_STAGE.huruf).toBe('abjad');
  });
});

describe('resolveSignKind', () => {
  it('memakai kind dari server bila tersedia', () => {
    expect(resolveSignKind('10', 'angka')).toBe('angka');
    // Label "L" dari model kata BISINDO tetap dihormati sebagai kata.
    expect(resolveSignKind('L', 'kata')).toBe('kata');
  });

  it('jatuh ke tebakan bentuk label bila server tidak mengirim kind', () => {
    expect(resolveSignKind('7')).toBe('angka');
    expect(resolveSignKind('A', null)).toBe('huruf');
    expect(resolveSignKind('Mereka', undefined)).toBe('kata');
  });
});

/** Helper: hasil `stage=auto` dari server. */
const autoResult = (
  overrides: Partial<SignRecognitionResult> = {}
): SignRecognitionResult => ({
  text: '',
  confidence: 0,
  candidates: [],
  mode: 'BISINDO',
  stage: 'auto',
  model_loaded: true,
  note: null,
  ...overrides,
});

describe('resolveAutoResult', () => {
  it('satu angka dari server dipakai apa adanya beserta kind-nya', () => {
    const result = resolveAutoResult(
      autoResult({
        text: '7',
        kind: 'angka',
        confidence: 0.99,
        candidates: [{ label: '7', confidence: 0.99, kind: 'angka' }],
      })
    );
    expect(result.text).toBe('7');
    expect(result.kind).toBe('angka');
    expect(result.tokens).toEqual([{ label: '7', kind: 'angka', confidence: 0.99 }]);
    expect(result.note).toBeNull();
  });

  it('kata tetap kata meski labelnya satu huruf (kind server menang)', () => {
    const result = resolveAutoResult(autoResult({ text: 'Mereka', kind: 'kata', confidence: 0.8 }));
    expect(result.text).toBe('MEREKA');
    expect(result.kind).toBe('kata');
  });

  it('segments multi-isyarat jadi token rangkaian, teks dari server dipakai', () => {
    const result = resolveAutoResult(
      autoResult({
        text: 'ABC',
        kind: 'huruf',
        confidence: 0.97,
        segments: [
          { label: 'A', kind: 'huruf', confidence: 0.98, startMs: 0, endMs: 933 },
          { label: 'B', kind: 'huruf', confidence: 0.97, startMs: 1000, endMs: 1933 },
          { label: 'C', kind: 'huruf', confidence: 0.99, startMs: 2000, endMs: 2933 },
        ],
      })
    );
    expect(result.text).toBe('ABC');
    expect(result.kind).toBe('rangkai');
    expect(result.tokens.map((token) => token.label)).toEqual(['A', 'B', 'C']);
  });

  it('tanpa teks server, token segments dirangkai sendiri', () => {
    const result = resolveAutoResult(
      autoResult({
        segments: [
          { label: '1', kind: 'angka', confidence: 0.9, startMs: 0, endMs: 900 },
          { label: '2', kind: 'angka', confidence: 0.9, startMs: 1000, endMs: 1900 },
        ],
      })
    );
    expect(result.text).toBe('1 2');
    expect(result.kind).toBe('rangkai');
  });

  it('hasil kosong memakai catatan server', () => {
    const result = resolveAutoResult(autoResult({ note: 'Tidak ada tangan terdeteksi.' }));
    expect(result.text).toBe('');
    expect(result.kind).toBeNull();
    expect(result.note).toBe('Tidak ada tangan terdeteksi.');
  });

  it('hasil null aman dan tetap bercatatan', () => {
    const result = resolveAutoResult(null);
    expect(result.text).toBe('');
    expect(result.note).toBeTruthy();
  });

  // Respons nyata server untuk Dataset/Video/Angka/7/Angka 7-1.mp4: kandidat
  // kata "Bingung" (0.86) tetap kalah karena server sudah memutuskan kind-nya.
  it('angka menang atas kandidat kata pada respons nyata server', () => {
    const result = resolveAutoResult(
      autoResult({
        text: '7',
        kind: 'angka',
        confidence: 0.9999847412109375,
        candidates: [
          { label: '7', confidence: 0.9999998807907104, kind: 'angka' },
          { label: 'Bingung', confidence: 0.8638699054718018, kind: 'kata' },
          { label: 'Hijau', confidence: 0.11176732182502747, kind: 'kata' },
        ],
      })
    );
    expect(result.text).toBe('7');
    expect(result.kind).toBe('angka');
  });
});

describe('resolveStaticFramesResult', () => {
  const digits = (labels: string[]): SequenceToken[] =>
    labels.map((label) => ({ label, kind: 'angka' as const, confidence: 0.9 }));

  // Respons nyata stage=angka untuk 5 frame Dataset/Gambar/Angka/12 (semua "12").
  it('frame angka yang stabil menghasilkan satu token angka', () => {
    const tokens = assembleSignTimeline([
      sample(0, '12', 1),
      sample(900, '12', 1),
      sample(1800, '12', 1),
      sample(2700, '12', 0.999),
      sample(3600, '12', 0.996),
    ]);
    const result = resolveStaticFramesResult(tokens, [{ label: '12', confidence: 1 }], 'angka');
    expect(result.text).toBe('12');
    expect(result.kind).toBe('angka');
  });

  it('satu angka stabil memakai kind angka', () => {
    const result = resolveStaticFramesResult(digits(['7']), [{ label: '7', confidence: 0.9 }], 'angka');
    expect(result.text).toBe('7');
    expect(result.kind).toBe('angka');
    expect(result.note).toBeNull();
  });

  it('beberapa angka berurutan jadi rangkaian dipisah spasi', () => {
    const result = resolveStaticFramesResult(digits(['1', '2']), [], 'angka');
    expect(result.text).toBe('1 2');
    expect(result.kind).toBe('rangkai');
  });

  it('tanpa token: catatan per mode dan kandidat mentah tetap dikembalikan', () => {
    const result = resolveStaticFramesResult(
      [],
      [
        { label: '3', confidence: 0.1 },
        { label: '9', confidence: 0.2 },
        { label: '3', confidence: 0.15 },
      ],
      'angka'
    );
    expect(result.text).toBe('');
    expect(result.kind).toBeNull();
    expect(result.note).toContain('angka');
    // Kandidat dari banyak frame digabung: satu baris per label, ambil terbaik.
    expect(result.candidates).toEqual([
      { label: '9', confidence: 0.2 },
      { label: '3', confidence: 0.15 },
    ]);
  });
});

describe('buildSuggestions', () => {
  // Server selalu mengirim kandidat walaupun `text` dikosongkan karena
  // keyakinan di bawah ambang. Diukur pada protokol peraga-tersembunyi, pada
  // 61,5% rekaman yang tertahan itu jawaban yang benar ada di dalam daftar ini
  // - jadi menyaringnya harus konservatif dan urutannya harus benar.
  const kandidat = [
    { label: 'Kuning', confidence: 0.42 },
    { label: 'Hijau', confidence: 0.31 },
    { label: 'Makan', confidence: 0.18 },
    { label: 'Hitam', confidence: 0.05 },
  ];

  it('mengambil kandidat terkuat sampai batas jumlah', () => {
    expect(buildSuggestions(kandidat)).toEqual([
      { label: 'Kuning', confidence: 0.42 },
      { label: 'Hijau', confidence: 0.31 },
      { label: 'Makan', confidence: 0.18 },
    ]);
  });

  it('membuang tebakan di bawah ambang keyakinan', () => {
    // 0,05 adalah tebakan acak - menampilkannya hanya menambah kebisingan.
    expect(buildSuggestions(kandidat).map((item) => item.label)).not.toContain('Hitam');
  });

  it('mengurutkan menurun walau server mengirim urutan acak', () => {
    const acak = [
      { label: 'Makan', confidence: 0.18 },
      { label: 'Kuning', confidence: 0.42 },
      { label: 'Hijau', confidence: 0.31 },
    ];
    expect(buildSuggestions(acak).map((item) => item.label)).toEqual([
      'Kuning',
      'Hijau',
      'Makan',
    ]);
  });

  it('menyaring menurut jenis yang sedang dikunci pengguna', () => {
    // Mode Huruf tidak boleh menawarkan kata.
    const campur = [
      { label: 'Kuning', confidence: 0.42 },
      { label: 'B', confidence: 0.33 },
      { label: '7', confidence: 0.3 },
    ];
    expect(buildSuggestions(campur, isLetterLabel)).toEqual([
      { label: 'B', confidence: 0.33 },
    ]);
  });

  it('membuang label kembar dari beberapa segmen rekaman', () => {
    const kembar = [
      { label: 'Halo', confidence: 0.4 },
      { label: 'halo', confidence: 0.35 },
      { label: 'Marah', confidence: 0.2 },
    ];
    expect(buildSuggestions(kembar).map((item) => item.label)).toEqual(['Halo', 'Marah']);
  });

  it('memangkas spasi dan mengabaikan label kosong', () => {
    const kotor = [
      { label: '  Sabar  ', confidence: 0.4 },
      { label: '   ', confidence: 0.9 },
    ];
    expect(buildSuggestions(kotor)).toEqual([{ label: 'Sabar', confidence: 0.4 }]);
  });

  it('mengembalikan daftar kosong bila server tidak mengirim kandidat', () => {
    expect(buildSuggestions(undefined)).toEqual([]);
    expect(buildSuggestions([])).toEqual([]);
  });

  it('memakai ambang dan batas bawaan yang terdokumentasi', () => {
    expect(SUGGESTION_MIN_CONFIDENCE).toBe(0.15);
    expect(SUGGESTION_LIMIT).toBe(3);
  });
});
