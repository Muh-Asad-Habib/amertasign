/**
 * Shim kompatibilitas — sumber kebenaran ada di `theme/`.
 * Dipertahankan agar import lama `Layout.spacing.*` dll tetap bekerja.
 */
import { radius as themeRadius, spacing as themeSpacing, touchTargetMin as themeTouchTarget } from '../theme';

export const Layout = {
  spacing: themeSpacing,
  radius: themeRadius,
  touchTargetMin: themeTouchTarget,
  fontSize: {
    xs: 12,
    sm: 14,
    body: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 36,
  },
} as const;
