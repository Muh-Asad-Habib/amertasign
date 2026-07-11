import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';

import { colors, layoutSpacing, radius, shadow } from '../../theme';
import PressableScale from './PressableScale';

type CardVariant = 'default' | 'elevated' | 'muted';

export interface CardProps extends Pick<ViewProps, 'children'> {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: CardVariant;
  /** Alias lama: setara variant="elevated". */
  elevated?: boolean;
  padding?: number;
  accessibilityLabel?: string;
  /** Getaran halus saat ditekan (hanya bila onPress). Default false. */
  haptic?: boolean;
}

const getVariantStyle = (variant: CardVariant): ViewStyle => {
  switch (variant) {
    case 'elevated':
      return { backgroundColor: colors.surface, borderColor: colors.border, ...shadow.md };
    case 'muted':
      return { backgroundColor: colors.surfaceMuted, borderColor: colors.border };
    case 'default':
    default:
      return { backgroundColor: colors.surface, borderColor: colors.border };
  }
};

export default function Card({
  children,
  style,
  onPress,
  variant,
  elevated = false,
  padding = layoutSpacing.cardPadding,
  accessibilityLabel,
  haptic = false,
}: CardProps) {
  const resolvedVariant: CardVariant = variant ?? (elevated ? 'elevated' : 'default');

  const baseStyle: ViewStyle = {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding,
    ...getVariantStyle(resolvedVariant),
  };

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        haptic={haptic}
        onPress={onPress}
        style={[baseStyle, style]}
      >
        {children}
      </PressableScale>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
