import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

const COLORS = {
  background: '#FFFFFF',
  border: '#E2E8F0',
};

export interface CardProps extends Pick<ViewProps, 'children'> {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
}

export default function Card({ children, style, onPress, elevated = false }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          elevated && styles.elevated,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.base, elevated && styles.elevated, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  elevated: {
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  pressed: {
    opacity: 0.92,
  },
});
