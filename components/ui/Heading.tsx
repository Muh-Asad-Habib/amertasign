import React from 'react';
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, headingStyles, type HeadingVariant } from '../../theme';

type HeadingColor = 'default' | 'primary' | 'onPrimary' | 'onAccent';

const colorMap: Record<HeadingColor, string> = {
  default: colors.text,
  primary: colors.primary,
  onPrimary: colors.textOnPrimary,
  onAccent: colors.textOnAccent,
};

export interface HeadingProps extends RNTextProps {
  variant?: HeadingVariant;
  color?: HeadingColor;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

/** Judul dengan font display Fredoka (membulat & ceria) + peran tipografi + warna token. */
export default function Heading({
  variant = 'title',
  color = 'default',
  align,
  style,
  children,
  ...rest
}: HeadingProps) {
  return (
    <RNText
      style={[headingStyles[variant], { color: colorMap[color], textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
