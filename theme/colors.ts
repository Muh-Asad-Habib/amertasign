/**
 * AmertaSign Design Tokens — Warna
 * Palet resmi dari logo AMERTA:
 * - Biru #0554CA — teknologi, AI, profesionalitas, kepercayaan.
 * - Emas #FBB604 — energi, kreativitas, komunikasi, semangat.
 * Nama token dipertahankan agar perubahan menjalar ke seluruh layar.
 */
export const palette = {
  // Primary — Biru logo AMERTA (#0554CA)
  primary50: '#DAE4FB',
  primary100: '#B0C8F5',
  primary500: '#0554CA', // brand — warna biru logo
  primary600: '#0554CA', // brand
  primary700: '#0443A2', // pressed

  // Accent — Emas logo AMERTA (#FBB604)
  accent50: '#FEF0CC',
  accent400: '#FCC530',
  accent500: '#FBB604', // brand — warna emas logo
  accent600: '#DBA004',

  // Pop — Vermilion (sorotan langka)
  pop: '#E04E2A',

  // Netral (surface bersih Material 3)
  ink: '#191C1E',
  textSecondary: '#424654',
  textTertiary: '#737785',
  border: '#C3C6D6',
  surfaceMuted: '#ECEEF0',
  background: '#F7F9FB',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // Semantic
  success: '#2F855A',
  successTint: '#E4F0E8',
  error: '#BA1A1A',
  errorTint: '#FFDAD6',
  warning: '#7C5800',
  warningTint: '#FFDEA7',
} as const;

/** Skema tema aplikasi. */
export type ThemeScheme = 'light' | 'dark';

/** Peran warna semantik — tema terang (default). */
const lightColors = {
  primary: palette.primary600,
  primaryStrong: palette.primary700,
  primarySoft: palette.primary100,
  primarySurface: palette.primary50,

  accent: palette.accent500,
  accentStrong: palette.accent600,
  accentSurface: palette.accent50,

  pop: palette.pop,

  background: palette.background,
  surface: palette.surface,
  surfaceMuted: palette.surfaceMuted,
  border: palette.border,

  text: palette.ink,
  textSecondary: palette.textSecondary,
  textTertiary: palette.textTertiary,
  textOnPrimary: palette.surface,
  textOnAccent: palette.ink,

  success: palette.success,
  successTint: palette.successTint,
  error: palette.error,
  errorTint: palette.errorTint,
  warning: palette.warning,
  warningTint: palette.warningTint,
} as const;

export type AppColors = Record<keyof typeof lightColors, string>;

/** Tema gelap — permukaan biru-tinta dalam, aksen emas tetap hangat. */
const darkColors: AppColors = {
  primary: '#5B93F2',
  primaryStrong: '#8FB4F7',
  primarySoft: '#2B4270',
  primarySurface: '#1E3050',

  accent: '#FBB604',
  accentStrong: '#FFC93D',
  accentSurface: '#3B2F10',

  pop: '#FF7A4D',

  background: '#0E1524',
  surface: '#182032',
  surfaceMuted: '#212D45',
  border: '#31415F',

  text: '#F2F5FA',
  textSecondary: '#B8C2D6',
  textTertiary: '#8A96AC',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#191C1E',

  success: '#63C08F',
  successTint: '#17352A',
  error: '#FF8078',
  errorTint: '#42201E',
  warning: '#E8C36A',
  warningTint: '#3A2F14',
};

export const themes: Record<ThemeScheme, AppColors> = {
  light: lightColors,
  dark: darkColors,
};

let activeScheme: ThemeScheme = 'light';

/** Setel skema aktif (dipanggil settings store); pemicu render ulang ada di root layout. */
export const setActiveColorScheme = (scheme: ThemeScheme) => {
  activeScheme = scheme;
};

export const getActiveColorScheme = (): ThemeScheme => activeScheme;

/**
 * Token warna dinamis: setiap akses properti membaca tema aktif, sehingga
 * pemakaian inline (mis. warna ikon di JSX) otomatis mengikuti mode gelap/terang.
 * Untuk StyleSheet, gunakan `createSheet` dari theme/sheet.
 */
export const colors: AppColors = new Proxy({} as AppColors, {
  get: (_target, prop) => themes[activeScheme][prop as keyof AppColors],
  ownKeys: () => Reflect.ownKeys(lightColors),
  getOwnPropertyDescriptor: (_target, prop) => ({
    enumerable: true,
    configurable: true,
    value: themes[activeScheme][prop as keyof AppColors],
  }),
});

/**
 * Palet "permen" ceria untuk arah Have Fun — aksen rotasi pada kategori,
 * stiker, sparkle, dan confetti. Tetap selaras dengan brand hangat.
 */
export const pops = [
  { name: 'blue', color: '#0554CA', surface: '#DAE4FB', on: '#FFFFFF' },
  { name: 'saffron', color: '#FBB604', surface: '#FEF0CC', on: '#191C1E' },
  { name: 'sky', color: '#2F9FD0', surface: '#DCEFF8', on: '#FFFFFF' },
  { name: 'indigo', color: '#0443A2', surface: '#DDE5FF', on: '#FFFFFF' },
  { name: 'grape', color: '#7A6CF0', surface: '#E8E5FB', on: '#FFFFFF' },
  { name: 'coral', color: '#F2683C', surface: '#FBE4D7', on: '#FFFFFF' },
  { name: 'mint', color: '#27B07A', surface: '#DBF3E8', on: '#FFFFFF' },
] as const;

export type Pop = (typeof pops)[number];

/** Ambil warna permen berdasarkan indeks (berputar). */
export const popAt = (index: number): Pop => pops[((index % pops.length) + pops.length) % pops.length];

/** Warna-warni confetti untuk momen celebrasi. */
export const confettiColors = ['#FBB604', '#0554CA', '#0443A2', '#2F9FD0', '#7A6CF0', '#27B07A', '#F2683C'] as const;

/**
 * Gradien & overlay untuk kedalaman ekspresif (hero, kartu aksi, kamera).
 * Dipakai dengan expo-linear-gradient / react-native-svg.
 */
export const gradients = {
  /** Biru logo AMERTA — tombol/kartu primer berani. */
  primary: ['#2D74E0', '#0554CA', '#0443A2'] as const,
  /** Emas logo AMERTA — kartu aksi sekunder. */
  accent: ['#FCC530', '#FBB604', '#DBA004'] as const,
  /** Tinta gelap — permukaan kamera & layar imersif. */
  ink: ['#232838', '#191C1E', '#0E0F14'] as const,
  /** Permukaan lembut — latar layar dengan transisi halus. */
  paper: ['#FFFFFF', '#F7F9FB'] as const,
} as const;

/** Lapisan overlay/scrim semi-transparan (di atas warna brand/tinta). */
export const overlay = {
  /** Scrim modal/sheet — cukup pekat untuk isolasi konten depan. */
  scrim: 'rgba(25, 28, 30, 0.55)',
  /** Lingkaran ikon di atas permukaan brand gelap. */
  onBrandSoft: 'rgba(255, 255, 255, 0.18)',
  onBrandStrong: 'rgba(255, 255, 255, 0.28)',
  /** Sorotan di atas permukaan tinta gelap (kamera). */
  onInkSoft: 'rgba(255, 255, 255, 0.1)',
  onInkBorder: 'rgba(255, 255, 255, 0.16)',
} as const;
