import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

export interface SquiggleProps {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Garis bawah "gestural" bergaya tulisan tangan — motif tanda tangan AmertaSign.
 * Dipakai sebagai aksen di bawah judul.
 */
export default function Squiggle({
  width = 72,
  height = 10,
  color = colors.accent,
  strokeWidth = 4,
  style,
}: SquiggleProps) {
  // Path bergelombang yang dinormalisasi ke viewBox 100x12.
  const d = 'M2 8 C 18 1, 30 1, 46 7 S 78 12, 98 4';

  return (
    <Svg width={width} height={height} viewBox="0 0 100 12" fill="none" style={style}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
