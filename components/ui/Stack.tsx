import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { layoutSpacing, spacing, type SpacingToken } from '../../theme';

type GapValue = SpacingToken | number;

export interface StackProps {
  children: React.ReactNode;
  /** Jarak antar anak. Token spacing atau angka. Default: stackGap (12). */
  gap?: GapValue;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
  style?: StyleProp<ViewStyle>;
}

export const resolveGap = (gap?: GapValue): number => {
  if (gap === undefined) {
    return layoutSpacing.stackGap;
  }
  if (typeof gap === 'number') {
    return gap;
  }
  return spacing[gap];
};

/** Susun anak secara vertikal dengan jarak konsisten via `gap`. */
export default function Stack({
  children,
  gap,
  align,
  justify,
  flex,
  style,
}: StackProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'column',
          gap: resolveGap(gap),
          alignItems: align,
          justifyContent: justify,
          flex,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
