import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { confettiColors } from '../../theme';

import { createSheet } from '../../theme';

interface SparkleItem {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  size: number;
  color: string;
  delay: number;
}

export interface SparklesProps {
  items?: SparkleItem[];
  style?: StyleProp<ViewStyle>;
}

// Bintang 4-titik (twinkle) pada viewBox 24.
const STAR_PATH = 'M12 0 C13.2 7.2 16.8 10.8 24 12 C16.8 13.2 13.2 16.8 12 24 C10.8 16.8 7.2 13.2 0 12 C7.2 10.8 10.8 7.2 12 0 Z';

const DEFAULT_ITEMS: SparkleItem[] = [
  { top: 6, right: 24, size: 22, color: confettiColors[0], delay: 0 },
  { top: 70, right: 96, size: 13, color: confettiColors[3], delay: 320 },
  { top: 40, right: 150, size: 10, color: confettiColors[5], delay: 680 },
  { top: 120, right: 36, size: 16, color: confettiColors[2], delay: 480 },
  { top: 150, right: 120, size: 11, color: confettiColors[4], delay: 900 },
];

function Sparkle({ item, reduce }: { item: SparkleItem; reduce: boolean }) {
  const t = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      return;
    }
    t.value = withDelay(
      item.delay,
      withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
  }, [item.delay, reduce, t]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + t.value * 0.6,
    transform: [{ scale: 0.78 + t.value * 0.34 }, { rotate: `${t.value * 22}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        { top: item.top, left: item.left, right: item.right, bottom: item.bottom },
        animatedStyle,
      ]}
    >
      <Svg width={item.size} height={item.size} viewBox="0 0 24 24">
        <Path d={STAR_PATH} fill={item.color} />
      </Svg>
    </Animated.View>
  );
}

/** Bintang berkilau melayang — atmosfer ceria di balik header/hero. */
export default function Sparkles({ items = DEFAULT_ITEMS, style }: SparklesProps) {
  const reduce = useReducedMotion();

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {items.map((item, index) => (
        <Sparkle item={item} key={index} reduce={reduce} />
      ))}
    </View>
  );
}

const styles = createSheet((colors) => ({
  sparkle: {
    position: 'absolute',
  },
}));
