/**
 * AmertaSign Design System — pintu masuk token tunggal.
 * Impor dari sini: `import { theme } from '../theme'` atau token individual.
 */
export {
  colors,
  palette,
  gradients,
  overlay,
  pops,
  popAt,
  confettiColors,
  themes,
  setActiveColorScheme,
  getActiveColorScheme,
} from './colors';
export type { AppColors, Pop, ThemeScheme } from './colors';
export { createSheet } from './sheet';
export {
  spacing,
  layoutSpacing,
  radius,
  shadow,
  motion,
  touchTargetMin,
} from './layout';
export type { SpacingToken } from './layout';
export {
  fontFamily,
  headingStyles,
  textStyles,
} from './typography';
export type {
  FontMap,
  HeadingVariant,
  TextVariant,
} from './typography';

import { colors, palette, gradients, overlay, pops, popAt, confettiColors } from './colors';
import {
  spacing,
  layoutSpacing,
  radius,
  shadow,
  motion,
  touchTargetMin,
} from './layout';
import { fontFamily, headingStyles, textStyles } from './typography';

export const theme = {
  colors,
  palette,
  gradients,
  overlay,
  pops,
  popAt,
  confettiColors,
  spacing,
  layoutSpacing,
  radius,
  shadow,
  motion,
  touchTargetMin,
  fontFamily,
  headingStyles,
  textStyles,
} as const;

export type Theme = typeof theme;
