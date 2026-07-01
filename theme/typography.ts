/**
 * AmertaSign Design Tokens — Tipografi.
 * Arah "Have Fun": Display = Fredoka (rounded, chunky, ceria). Teks = Lexend (mudah dibaca).
 * Dimuat via expo-font di app/_layout.tsx. Fallback ke font sistem bila gagal.
 */
import type { TextStyle } from 'react-native';

/** Nama keluarga font sesuai paket @expo-google-fonts. */
export const fontFamily = {
  // Display — Fredoka (membulat & playful)
  displayRegular: 'Fredoka_500Medium',
  displaySemiBold: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  displayExtraBold: 'Fredoka_700Bold',
  displayBlack: 'Fredoka_700Bold',
  displayItalic: 'Fredoka_600SemiBold',
  // Body — Lexend
  bodyRegular: 'Lexend_400Regular',
  bodyMedium: 'Lexend_500Medium',
  bodySemiBold: 'Lexend_600SemiBold',
} as const;

export type FontMap = Record<string, number>;

export type HeadingVariant = 'display' | 'hero' | 'title' | 'h2';
export type TextVariant = 'body' | 'bodyStrong' | 'caption' | 'label' | 'kicker';

export const headingStyles: Record<HeadingVariant, TextStyle> = {
  // Poster — momen hero besar (chunky & ceria). Pakai sehemat mungkin.
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -0.5,
  },
  hero: {
    fontFamily: fontFamily.displayBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: 0,
  },
};

export const textStyles: Record<TextVariant, TextStyle> = {
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  // Kicker editorial — uppercase, tracking lebar
  kicker: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
};
