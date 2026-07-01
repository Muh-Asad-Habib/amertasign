/**
 * Shim kompatibilitas — sumber kebenaran warna ada di `theme/`.
 * Dipertahankan agar import lama `Colors.light.*` tetap bekerja.
 */
import { colors as themeColors } from '../theme';

export const Colors = {
  light: {
    primary: themeColors.primary,
    accent: themeColors.accent,
    secondary: themeColors.accent,
    background: themeColors.background,
    surface: themeColors.surface,
    surfaceMuted: themeColors.surfaceMuted,
    text: themeColors.text,
    textPrimary: themeColors.text,
    textSecondary: themeColors.textSecondary,
    textTertiary: themeColors.textTertiary,
    success: themeColors.success,
    error: themeColors.error,
    warning: themeColors.warning,
    border: themeColors.border,
  },
} as const;

export type AppTheme = keyof typeof Colors;
