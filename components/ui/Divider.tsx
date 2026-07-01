import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { colors, spacing } from '../../theme';

export interface DividerProps {
  spacingY?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Garis pemisah tipis. */
export default function Divider({ spacingY = spacing.md, color = colors.border, style }: DividerProps) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: color,
          marginVertical: spacingY,
        },
        style,
      ]}
    />
  );
}
