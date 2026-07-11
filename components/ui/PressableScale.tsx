import React, { useCallback } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { motion } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Skala saat ditekan. Default token motion.pressScale (0.97). */
  scaleTo?: number;
  /**
   * Getaran halus saat ditekan. Default false — getar hanya dipakai
   * di momen bermakna (mis. tombol rekam deteksi di fitur Translate),
   * bukan di setiap sentuhan.
   */
  haptic?: boolean;
}

/**
 * Permukaan tappable dengan umpan-balik tekan tactile (spring scale).
 * Menghormati prefers-reduced-motion: skala dimatikan bila pengguna meminta.
 * Fondasi rasa "berani & hidup" yang dipakai konsisten di seluruh aplikasi.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = motion.pressScale,
  haptic = false,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        if (!reduceMotion) {
          scale.value = withSpring(scaleTo, motion.springPress);
        }
        if (haptic) {
          Haptics.selectionAsync().catch(() => {});
        }
      }
      onPressIn?.(event);
    },
    [disabled, haptic, onPressIn, reduceMotion, scale, scaleTo]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      // Kembali halus saat dilepas, tanpa pantulan berlebih.
      scale.value = withSpring(1, motion.springSoft);
      onPressOut?.(event);
    },
    [onPressOut, scale]
  );

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
