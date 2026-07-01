import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { confettiColors } from '../../theme';

export interface ConfettiProps {
  /** Naikkan nilainya untuk memicu ledakan confetti baru. 0 = diam. */
  runKey: number;
  count?: number;
  originY?: number;
}

function Piece({
  screenW,
  screenH,
  originY,
}: {
  screenW: number;
  screenH: number;
  originY: number;
}) {
  const config = useMemo(() => {
    const colors = confettiColors;
    const size = 8 + Math.random() * 7;
    return {
      startX: (Math.random() - 0.5) * 60,
      spreadX: (Math.random() - 0.5) * screenW * 1.1,
      fall: screenH * (0.5 + Math.random() * 0.4),
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 180,
      duration: 1300 + Math.random() * 700,
      size,
      isCircle: Math.random() > 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }, [screenH, screenW]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) })
    );
  }, [config.delay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const opacity = p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
    return {
      opacity,
      transform: [
        { translateX: config.startX + config.spreadX * p },
        { translateY: p * config.fall },
        { rotate: `${config.rotate * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          top: originY,
          left: screenW / 2,
          width: config.size,
          height: config.isCircle ? config.size : config.size * 0.6,
          borderRadius: config.isCircle ? config.size / 2 : 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

/** Ledakan confetti untuk momen celebrasi (mis. menyelesaikan modul). */
export default function Confetti({ runKey, count = 28, originY = 80 }: ConfettiProps) {
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();

  if (reduce || !runKey) {
    return null;
  }

  return (
    <View key={runKey} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, index) => (
        <Piece key={index} originY={originY} screenH={height} screenW={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
