/**
 * AmertaSign Design Tokens — Warna
 * Arah: Material 3 "SignLink" (dari desain Stitch).
 * Primary biru tegas + aksen kuning saffron di atas permukaan bersih.
 * Nama token dipertahankan agar perubahan menjalar ke seluruh layar.
 */
export const palette = {
  // Primary — Biru "SignLink"
  primary50: '#DAE2FF',
  primary100: '#B2C5FF',
  primary500: '#0554CA', // primary-container Stitch
  primary600: '#003E9B', // brand (primary Stitch)
  primary700: '#0040A0', // pressed

  // Accent — Saffron kuning (secondary-container Stitch)
  accent50: '#FFF0C2',
  accent400: '#FFBB1A',
  accent500: '#FDB808', // brand
  accent600: '#E0A200',

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

/** Peran warna semantik yang dipakai komponen & layar. */
export const colors = {
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

export type AppColors = typeof colors;

/**
 * Palet "permen" ceria untuk arah Have Fun — aksen rotasi pada kategori,
 * stiker, sparkle, dan confetti. Tetap selaras dengan brand hangat.
 */
export const pops = [
  { name: 'blue', color: '#003E9B', surface: '#DAE2FF', on: '#FFFFFF' },
  { name: 'saffron', color: '#FDB808', surface: '#FFF0C2', on: '#191C1E' },
  { name: 'sky', color: '#2F9FD0', surface: '#DCEFF8', on: '#FFFFFF' },
  { name: 'indigo', color: '#0554CA', surface: '#DDE5FF', on: '#FFFFFF' },
  { name: 'grape', color: '#7A6CF0', surface: '#E8E5FB', on: '#FFFFFF' },
  { name: 'coral', color: '#F2683C', surface: '#FBE4D7', on: '#FFFFFF' },
  { name: 'mint', color: '#27B07A', surface: '#DBF3E8', on: '#FFFFFF' },
] as const;

export type Pop = (typeof pops)[number];

/** Ambil warna permen berdasarkan indeks (berputar). */
export const popAt = (index: number): Pop => pops[((index % pops.length) + pops.length) % pops.length];

/** Warna-warni confetti untuk momen celebrasi. */
export const confettiColors = ['#FDB808', '#003E9B', '#0554CA', '#2F9FD0', '#7A6CF0', '#27B07A', '#F2683C'] as const;

/**
 * Gradien & overlay untuk kedalaman ekspresif (hero, kartu aksi, kamera).
 * Dipakai dengan expo-linear-gradient / react-native-svg.
 */
export const gradients = {
  /** Biru SignLink — tombol/kartu primer berani. */
  primary: ['#0554CA', '#003E9B', '#0040A0'] as const,
  /** Saffron kuning — kartu aksi sekunder. */
  accent: ['#FFBB1A', '#FDB808', '#E0A200'] as const,
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
