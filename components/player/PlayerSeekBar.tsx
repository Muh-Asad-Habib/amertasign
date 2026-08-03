import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const TRACK_HEIGHT = 4;
const KNOB_SIZE = 14;
/** Area sentuh dilebarkan tanpa menambah tinggi visual garis. */
const HIT_HEIGHT = 28;

export interface PlayerSeekBarProps {
  /** Posisi pemutaran (detik). */
  currentTime: number;
  /** Durasi total (detik); 0 → penggeser dinonaktifkan. */
  duration: number;
  /** Dipanggil saat geseran dimulai (true) dan berakhir (false). */
  onScrubbingChange?: (scrubbing: boolean) => void;
  /** Dipanggil saat jari dilepas, membawa posisi tujuan (detik). */
  onSeekComplete: (seconds: number) => void;
  /** Warna isian progres. */
  accentColor: string;
  style?: StyleProp<ViewStyle>;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Langkah lompat untuk aksi increment/decrement pembaca layar. */
const A11Y_STEP_RATIO = 0.05;

const A11Y_ACTIONS = [
  { name: 'increment', label: 'Maju' },
  { name: 'decrement', label: 'Mundur' },
];

/**
 * Penggeser posisi video. Sengaja memakai `PanResponder` bawaan React Native:
 * aplikasi belum memasang `GestureHandlerRootView` di root sehingga
 * react-native-gesture-handler tidak bisa diandalkan di sini.
 */
export default function PlayerSeekBar({
  currentTime,
  duration,
  onScrubbingChange,
  onSeekComplete,
  accentColor,
  style,
}: PlayerSeekBarProps) {
  const [width, setWidth] = useState(0);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);

  // PanResponder dibuat sekali, jadi nilai terbaru dibaca lewat ref.
  const widthRef = useRef(0);
  const durationRef = useRef(duration);
  const grantRatioRef = useRef(0);
  const scrubRatioRef = useRef<number | null>(null);
  const callbacksRef = useRef({ onScrubbingChange, onSeekComplete });

  widthRef.current = width;
  durationRef.current = duration;
  scrubRatioRef.current = scrubRatio;
  callbacksRef.current = { onScrubbingChange, onSeekComplete };

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const applyRatio = useCallback((ratio: number) => {
    scrubRatioRef.current = ratio;
    setScrubRatio(ratio);
  }, []);

  const endScrub = useCallback((commit: boolean) => {
    const ratio = scrubRatioRef.current;
    scrubRatioRef.current = null;
    setScrubRatio(null);
    callbacksRef.current.onScrubbingChange?.(false);
    if (commit && ratio !== null && durationRef.current > 0) {
      callbacksRef.current.onSeekComplete(ratio * durationRef.current);
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => durationRef.current > 0,
        onMoveShouldSetPanResponder: () => durationRef.current > 0,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (durationRef.current <= 0 || widthRef.current <= 0) {
            return;
          }
          const ratio = clamp(event.nativeEvent.locationX / widthRef.current);
          grantRatioRef.current = ratio;
          applyRatio(ratio);
          callbacksRef.current.onScrubbingChange?.(true);
        },
        onPanResponderMove: (_event, gesture) => {
          if (durationRef.current <= 0 || widthRef.current <= 0) {
            return;
          }
          applyRatio(clamp(grantRatioRef.current + gesture.dx / widthRef.current));
        },
        // Geseran yang dibatalkan tetap dilaporkan selesai agar kontrol tidak
        // terkunci dalam status "sedang digeser".
        onPanResponderRelease: () => endScrub(true),
        onPanResponderTerminate: () => endScrub(false),
      }),
    [applyRatio, endScrub]
  );

  const ratio = scrubRatio ?? (duration > 0 ? clamp(currentTime / duration) : 0);
  const filledWidth = width * ratio;
  const isScrubbing = scrubRatio !== null;

  // Pembaca layar mengambil alih sentuhan, jadi seek juga disediakan lewat
  // aksi increment/decrement bawaan peran "adjustable".
  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (duration <= 0) {
        return;
      }
      const step = duration * A11Y_STEP_RATIO;
      const delta =
        event.nativeEvent.actionName === 'increment'
          ? step
          : event.nativeEvent.actionName === 'decrement'
            ? -step
            : 0;
      if (delta === 0) {
        return;
      }
      onSeekComplete(Math.min(duration, Math.max(0, currentTime + delta)));
    },
    [currentTime, duration, onSeekComplete]
  );

  return (
    <View
      accessibilityActions={A11Y_ACTIONS}
      accessibilityRole="adjustable"
      accessibilityLabel="Posisi pemutaran video"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={handleLayout}
      style={[styles.hitArea, style]}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.filled, { backgroundColor: accentColor, width: filledWidth }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          {
            backgroundColor: accentColor,
            transform: [
              { translateX: filledWidth - KNOB_SIZE / 2 },
              { scale: isScrubbing ? 1.35 : 1 },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    height: HIT_HEIGHT,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: TRACK_HEIGHT / 2,
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    width: '100%',
  },
  filled: {
    borderRadius: TRACK_HEIGHT / 2,
    height: '100%',
  },
  knob: {
    borderRadius: KNOB_SIZE / 2,
    height: KNOB_SIZE,
    left: 0,
    position: 'absolute',
    width: KNOB_SIZE,
  },
});
