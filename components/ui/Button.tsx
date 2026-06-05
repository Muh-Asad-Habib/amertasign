import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

const COLORS = {
  primary: '#2563EB',
  accent: '#F59E0B',
  background: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

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
  style?: StyleProp<ViewStyle>;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
};

const textSizeStyles: Record<ButtonSize, object> = {
  sm: { fontSize: 15 },
  md: { fontSize: 16 },
  lg: { fontSize: 17 },
};

const getVariantStyle = (variant: ButtonVariant): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: COLORS.primary,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
    case 'primary':
    default:
      return {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
      };
  }
};

const getTextColor = (variant: ButtonVariant) => {
  switch (variant) {
    case 'secondary':
      return COLORS.text;
    case 'outline':
    case 'ghost':
      return COLORS.primary;
    case 'primary':
    default:
      return COLORS.white;
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
  style,
}: ButtonProps) {
  const textColor = getTextColor(variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(variant),
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
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
        <Text style={[styles.label, { color: textColor }, textSizeStyles[size]]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 48,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  leading: {
    marginRight: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
