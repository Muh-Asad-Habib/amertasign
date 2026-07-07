import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fontFamily } from '../../theme';

import { createSheet } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  labelColor?: string;
}

export default function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 10,
  color,
  trackColor,
  labelColor,
}: ProgressRingProps) {
  // Warna default dibaca saat render agar mengikuti tema aktif.
  const ringColor = color ?? colors.primary;
  const ringTrackColor = trackColor ?? colors.border;
  const ringLabelColor = labelColor ?? colors.text;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const animatedValue = useRef(new Animated.Value(clampedProgress)).current;
  const [animatedProgress, setAnimatedProgress] = useState(clampedProgress);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value }) => {
      setAnimatedProgress(value);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedValue, clampedProgress]);

  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const strokeDashoffset = circumference - animatedProgress * circumference;
  const percentage = Math.round(animatedProgress * 100);

  return (
    <View style={[styles.container, { height: size, width: size }]}> 
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={ringTrackColor}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={ringColor}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View pointerEvents="none" style={styles.labelContainer}>
        <Text style={[styles.label, { fontSize: Math.max(14, size * 0.2), color: ringLabelColor }]}>{percentage}%</Text>
      </View>
    </View>
  );
}

const styles = createSheet((colors) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  label: {
    color: colors.text,
    fontFamily: fontFamily.displayBold,
  },
}));
