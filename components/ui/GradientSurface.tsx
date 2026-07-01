import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients, radius as radiusToken, shadow as shadowToken } from '../../theme';
import PressableScale from './PressableScale';

type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl' | 'none';
type GradientStops = readonly [string, string, ...string[]];
type Point = { x: number; y: number };

export interface GradientSurfaceProps {
  children?: React.ReactNode;
  /** Stop gradien. Default token gradients.primary (teal Amerta). */
  colors?: GradientStops;
  start?: Point;
  end?: Point;
  radius?: number;
  padding?: number;
  shadowLevel?: ShadowLevel;
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Permukaan gradien membulat dengan bayangan hangat + tekan tactile opsional.
 * Inti tampilan "berani" — dipakai untuk hero, kartu aksi, dan header profil.
 */
export default function GradientSurface({
  children,
  colors = gradients.primary,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  radius = radiusToken.xl,
  padding,
  shadowLevel = 'lg',
  onPress,
  accessibilityLabel,
  disabled,
  style,
  contentStyle,
}: GradientSurfaceProps) {
  const frameStyle: ViewStyle = {
    borderRadius: radius,
    backgroundColor: colors[0],
    ...(shadowLevel === 'none' ? null : shadowToken[shadowLevel]),
  };

  const inner = (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[{ borderRadius: radius, overflow: 'hidden', padding }, contentStyle]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={onPress}
        style={[frameStyle, style]}
      >
        {inner}
      </PressableScale>
    );
  }

  return <View style={[frameStyle, style]}>{inner}</View>;
}
