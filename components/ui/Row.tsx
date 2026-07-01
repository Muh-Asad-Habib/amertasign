import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { layoutSpacing } from '../../theme';
import { resolveGap } from './Stack';
import type { StackProps } from './Stack';

export interface RowProps extends Omit<StackProps, 'align' | 'justify'> {
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
}

/** Susun anak secara horizontal dengan jarak konsisten via `gap`. */
export default function Row({
  children,
  gap,
  align = 'center',
  justify,
  flex,
  wrap = false,
  style,
}: RowProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: resolveGap(gap ?? layoutSpacing.stackGap),
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          flex,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
