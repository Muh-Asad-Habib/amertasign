/**
 * AmertaSign Design Tokens — Spacing, Radius, Shadow.
 * Skala spacing kelipatan 4. Token semantik mencegah elemen "berdempetan".
 */
import { Platform, type ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Token spacing semantik untuk pemakaian konsisten. */
export const layoutSpacing = {
  screenPadding: 20,
  sectionGap: 24,
  cardPadding: 16,
  stackGap: 12,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  full: 9999,
} as const;

export const touchTargetMin = 48;

/**
 * Token gerak — ritme animasi global "Have Fun": kenyal & memantul.
 * Press squishy + sedikit pantul; spring bouncy untuk entrance/pop yang ceria.
 */
export const motion = {
  duration: {
    fast: 150,
    base: 250,
    slow: 420,
  },
  /** Spring tekan kenyal tanpa pantulan berlebih (Reanimated withSpring). */
  springPress: { damping: 16, stiffness: 300, mass: 0.7 },
  /** Spring lembut untuk masuk/keluar elemen. */
  springSoft: { damping: 18, stiffness: 180, mass: 0.9 },
  /** Spring memantul ringan (overshoot halus) untuk pop & celebrasi. */
  springBouncy: { damping: 14, stiffness: 170, mass: 0.85 },
  /** Skala saat ditekan (halus). */
  pressScale: 0.97,
  /** Jeda antar item pada animasi berurutan (stagger). */
  stagger: 70,
} as const;

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const makeShadow = (
  offsetHeight: number,
  shadowRadius: number,
  shadowOpacity: number,
  elevation: number
): ShadowStyle =>
  Platform.select<ShadowStyle>({
    web: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: offsetHeight },
      shadowOpacity,
      shadowRadius,
    },
    default: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: offsetHeight },
      shadowOpacity,
      shadowRadius,
      elevation,
    },
  }) as ShadowStyle;

export const shadow = {
  sm: makeShadow(2, 6, 0.06, 1),
  md: makeShadow(8, 16, 0.1, 4),
  lg: makeShadow(16, 28, 0.14, 10),
  xl: makeShadow(24, 40, 0.18, 16),
} as const;

export type SpacingToken = keyof typeof spacing;
