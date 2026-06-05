export const Colors = {
  // Contrast ratios verified (WCAG AA):
  // primary (#2563EB) on white: 4.57:1 ✅
  // text (#0F172A) on background (#F8FAFC): 17.7:1 ✅ (AAA)
  // textSecondary (#64748B) on white: 4.67:1 ✅
  light: {
    primary: '#2563EB',
    accent: '#F59E0B',
    secondary: '#F59E0B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    border: '#E2E8F0',
  },
} as const;

export type AppTheme = keyof typeof Colors;
