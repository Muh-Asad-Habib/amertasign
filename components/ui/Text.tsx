import React from 'react';
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, textStyles, type TextVariant } from '../../theme';

type TextColor = 'default' | 'secondary' | 'tertiary' | 'primary' | 'onPrimary' | 'onAccent' | 'error' | 'success';

/** Dibaca saat render agar mengikuti tema aktif (gelap/terang). */
const colorFor = (color: TextColor): string =>
  ({
    default: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    primary: colors.primary,
    onPrimary: colors.textOnPrimary,
    onAccent: colors.textOnAccent,
    error: colors.error,
    success: colors.success,
  })[color];

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

/** Teks dengan font Lexend + peran tipografi + warna token. */
export default function Text({
  variant = 'body',
  color = 'default',
  align,
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[textStyles[variant], { color: colorFor(color), textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
