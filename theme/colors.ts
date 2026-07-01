/**
 * AmertaSign Design Tokens — Warna
 * Arah: Editorial Ekspresif / Gestural.
 * Palet hangat "kertas + tinta" dengan aksen teal-Amerta & saffron.
 * Nama token dipertahankan agar perubahan menjalar ke seluruh layar.
 */
export const palette = {
  // Primary — Teal "Amerta" (sari/kehidupan)
  primary50: '#E6F2EF',
  primary100: '#BFE0DB',
  primary500: '#14938A',
  primary600: '#0F766E', // brand
  primary700: '#0B5C55', // pressed

  // Accent — Saffron
  accent50: '#FCEFCF',
  accent400: '#FBC23C',
  accent500: '#F2A900', // brand
  accent600: '#C98A00',

  // Pop — Vermilion (sorotan langka)
  pop: '#E04E2A',

  // Netral hangat (kertas + tinta)
  ink: '#1A1714',
  textSecondary: '#6B6358',
  textTertiary: '#9A9183',
  border: '#E4DAC8',
  surfaceMuted: '#EFE7D6',
  background: '#F6F1E7',
  surface: '#FFFDF8',
  white: '#FFFFFF',

  // Semantic (hangat)
  success: '#2F855A',
  successTint: '#E4F0E8',
  error: '#C53030',
  errorTint: '#F7E4E1',
  warning: '#C98A00',
  warningTint: '#FCEFCF',
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
  { name: 'teal', color: '#0F766E', surface: '#E6F2EF', on: '#FFFFFF' },
  { name: 'saffron', color: '#F2A900', surface: '#FCEFCF', on: '#1A1714' },
  { name: 'coral', color: '#F2683C', surface: '#FBE4D7', on: '#FFFFFF' },
  { name: 'berry', color: '#E0568A', surface: '#FBE1EC', on: '#FFFFFF' },
  { name: 'grape', color: '#7A6CF0', surface: '#E8E5FB', on: '#FFFFFF' },
  { name: 'sky', color: '#2F9FD0', surface: '#DCEFF8', on: '#FFFFFF' },
  { name: 'mint', color: '#27B07A', surface: '#DBF3E8', on: '#FFFFFF' },
] as const;

export type Pop = (typeof pops)[number];

/** Ambil warna permen berdasarkan indeks (berputar). */
export const popAt = (index: number): Pop => pops[((index % pops.length) + pops.length) % pops.length];

/** Warna-warni confetti untuk momen celebrasi. */
export const confettiColors = ['#F2A900', '#F2683C', '#E0568A', '#7A6CF0', '#2F9FD0', '#27B07A', '#0F766E'] as const;

/**
 * Gradien & overlay untuk kedalaman ekspresif (hero, kartu aksi, kamera).
 * Dipakai dengan expo-linear-gradient / react-native-svg.
 */
export const gradients = {
  /** Teal Amerta — tombol/kartu primer berani. */
  primary: ['#14938A', '#0F766E', '#0B5C55'] as const,
  /** Saffron hangat — kartu aksi sekunder. */
  accent: ['#FBC23C', '#F2A900', '#C98A00'] as const,
  /** Tinta gelap hangat — permukaan kamera & layar imersif. */
  ink: ['#262019', '#1A1714', '#0E0B09'] as const,
  /** Kertas lembut — latar layar dengan transisi halus. */
  paper: ['#FBF7EE', '#F6F1E7'] as const,
} as const;

/** Lapisan overlay/scrim semi-transparan (di atas warna brand/tinta). */
export const overlay = {
  /** Scrim modal/sheet — cukup pekat untuk isolasi konten depan. */
  scrim: 'rgba(26, 23, 20, 0.55)',
  /** Lingkaran ikon di atas permukaan brand gelap. */
  onBrandSoft: 'rgba(255, 253, 248, 0.18)',
  onBrandStrong: 'rgba(255, 253, 248, 0.28)',
  /** Sorotan di atas permukaan tinta gelap (kamera). */
  onInkSoft: 'rgba(255, 253, 248, 0.1)',
  onInkBorder: 'rgba(255, 253, 248, 0.16)',
} as const;
