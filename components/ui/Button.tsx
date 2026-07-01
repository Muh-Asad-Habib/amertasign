import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fontFamily, radius, touchTargetMin } from '../../theme';
import PressableScale from './PressableScale';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: ButtonSize;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { minHeight: touchTargetMin, paddingHorizontal: 16, paddingVertical: 10 },
  md: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 12 },
  lg: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 14 },
};

const textSizeStyles: Record<ButtonSize, number> = { sm: 15, md: 16, lg: 17 };

const getVariantStyle = (variant: ButtonVariant, pressed: boolean): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: pressed ? colors.accentStrong : colors.accent,
        borderColor: pressed ? colors.accentStrong : colors.accent,
      };
    case 'outline':
      return {
        backgroundColor: pressed ? colors.primarySurface : 'transparent',
        borderColor: colors.primary,
      };
    case 'ghost':
      return {
        backgroundColor: pressed ? colors.primarySurface : 'transparent',
        borderColor: 'transparent',
      };
    case 'primary':
    default:
      return {
        backgroundColor: pressed ? colors.primaryStrong : colors.primary,
        borderColor: pressed ? colors.primaryStrong : colors.primary,
      };
  }
};

const getTextColor = (variant: ButtonVariant) => {
  switch (variant) {
    case 'secondary':
      return colors.textOnAccent;
    case 'outline':
    case 'ghost':
      return colors.primary;
    case 'primary':
    default:
      return colors.textOnPrimary;
  }
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  size = 'md',
  haptic = true,
  style,
}: ButtonProps) {
  const textColor = getTextColor(variant);
  const isDisabled = disabled || loading;
  const [pressed, setPressed] = useState(false);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      haptic={haptic && !isDisabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        getVariantStyle(variant, pressed && !isDisabled),
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} style={styles.leading} />
        ) : icon ? (
          <View style={styles.leading}>{icon}</View>
        ) : null}
        <Text style={[styles.label, { color: textColor, fontSize: textSizeStyles[size] }]}>{title}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: touchTargetMin,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  leading: {
    marginRight: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
