import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { spacing } from '../../theme';
import { useKeyboardWindowOverlap } from '../../hooks/useKeyboardOverlap';

/** Jarak napas antara field yang fokus dengan tepi atas keyboard. */
const FOCUS_MARGIN = spacing.md;

/**
 * Menunda pengukuran: saat `onFocus` dipicu, keyboard biasanya belum naik dan
 * layout belum stabil, sehingga hasil `measureInWindow` bisa keliru.
 */
const MEASURE_DELAY_MS = 90;

export interface KeyboardAwareScrollContextValue {
  /**
   * Gulirkan agar node yang diberikan tidak tertutup keyboard. Node diingat
   * sehingga posisinya dihitung ulang saat tinggi keyboard berubah.
   */
  ensureVisible: (node: View | null) => void;
  /** Lupakan node (dipanggil saat input kehilangan fokus atau di-unmount). */
  releaseNode: (node: View | null) => void;
}

const noop = () => {};

/**
 * Ruang bawah yang sudah diminta pemanggil lewat `contentContainerStyle`,
 * mengikuti urutan spesifisitas React Native: `paddingBottom` mengalahkan
 * `paddingVertical`, yang mengalahkan `padding`.
 */
function resolveBasePaddingBottom(style: ViewStyle): number {
  const candidates = [style.paddingBottom, style.paddingVertical, style.padding];
  for (const value of candidates) {
    if (typeof value === 'number') {
      return value;
    }
  }
  return 0;
}

const KeyboardAwareScrollContext = createContext<KeyboardAwareScrollContextValue>({
  ensureVisible: noop,
  releaseNode: noop,
});

/**
 * Hook untuk komponen input: kembalikan `ref` yang dipasang pada pembungkus
 * field, plus handler fokus/blur yang menjaga field tetap terlihat.
 *
 * Aman dipakai di luar `KeyboardAwareScrollView` — di sana menjadi no-op.
 */
export function useEnsureVisibleOnFocus() {
  const { ensureVisible, releaseNode } = useContext(KeyboardAwareScrollContext);
  const wrapperRef = useRef<View | null>(null);

  const handleFocus = useCallback(() => {
    ensureVisible(wrapperRef.current);
  }, [ensureVisible]);

  const handleBlur = useCallback(() => {
    releaseNode(wrapperRef.current);
  }, [releaseNode]);

  useEffect(() => () => releaseNode(wrapperRef.current), [releaseNode]);

  return { wrapperRef, handleFocus, handleBlur };
}

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Ruang ekstra di bawah konten, ditambahkan di atas tinggi keyboard. */
  extraBottomSpace?: number;
}

/**
 * `ScrollView` yang isinya tidak tertutup keyboard.
 *
 * Sejak Expo SDK 54 (React Native 0.81) Android berjalan edge-to-edge secara
 * paksa, sehingga `windowSoftInputMode=adjustResize` tidak lagi menyusutkan
 * window dan `KeyboardAvoidingView` tidak berpengaruh apa pun. Komponen ini
 * menggantikannya dengan dua mekanisme:
 *
 * 1. Menambah `paddingBottom` sebesar bagian ScrollView yang tertutup keyboard,
 *    supaya konten paling bawah tetap bisa digulir ke area yang terlihat.
 *    Besarnya diukur langsung dari posisi ScrollView di layar, jadi otomatis
 *    benar baik saat berada di dalam area aman bawah maupun tidak.
 * 2. Menggulirkan field yang sedang fokus ke atas keyboard, lewat context
 *    `ensureVisible` yang dipanggil otomatis oleh komponen input bersama
 *    (`Input`, `SearchBar`, `TextInputArea`).
 *
 * Posisi dihitung dengan `measureInWindow` pada pembungkus luar dan pada field,
 * bukan dengan membungkus `children`, supaya `contentContainerStyle` milik
 * pemanggil (`gap`, `flexGrow`, `justifyContent`) tetap berperilaku sama.
 */
const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      children,
      contentContainerStyle,
      extraBottomSpace = 0,
      keyboardDismissMode = 'on-drag',
      keyboardShouldPersistTaps = 'handled',
      onScroll,
      scrollEventThrottle = 16,
      showsVerticalScrollIndicator = false,
      style,
      ...props
    },
    ref
  ) {
    const scrollRef = useRef<ScrollView | null>(null);
    const containerRef = useRef<View | null>(null);
    const activeNodeRef = useRef<View | null>(null);
    const scrollYRef = useRef(0);
    const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tumpang tindih keyboard terhadap window. Berapa banyak yang benar-benar
    // menutupi ScrollView diukur terpisah lewat `measureInWindow`.
    const windowOverlap = useKeyboardWindowOverlap();
    // Dibaca di dalam setTimeout supaya selalu memakai nilai terbaru: saat
    // `onFocus` dipicu, keyboard biasanya belum naik sehingga nilai yang
    // ter-capture masih 0.
    const windowOverlapRef = useRef(windowOverlap);
    windowOverlapRef.current = windowOverlap;

    // Frame SafeAreaProvider berada di koordinat window yang sama dengan hasil
    // `measureInWindow`, jadi lebih tepercaya daripada `Dimensions`.
    const frame = useSafeAreaFrame();
    const frameBottom = frame.y + frame.height;
    const frameBottomRef = useRef(frameBottom);
    frameBottomRef.current = frameBottom;

    const [keyboardPadding, setKeyboardPadding] = useState(0);

    useImperativeHandle(ref, () => scrollRef.current as ScrollView);

    // Hitung bagian ScrollView yang tertutup keyboard. Karena layout tidak
    // berubah saat keyboard naik (edge-to-edge), posisi kontainer tetap valid.
    useEffect(() => {
      const container = containerRef.current;
      if (windowOverlap <= 0 || !container) {
        setKeyboardPadding(0);
        return;
      }

      container.measureInWindow((_x, containerY, _width, containerHeight) => {
        if (containerHeight <= 0) {
          return;
        }
        const keyboardTop = frameBottom - windowOverlap;
        const covered = containerY + containerHeight - keyboardTop;
        setKeyboardPadding(covered > 0 ? Math.round(covered) + extraBottomSpace : 0);
      });
    }, [extraBottomSpace, frameBottom, windowOverlap]);

    // Ruang bawah milik pemanggil tetap dipertahankan; padding keyboard
    // ditambahkan di atasnya, bukan menggantikannya.
    const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
    const basePaddingBottom = resolveBasePaddingBottom(flattenedContentStyle);
    const paddingBottom = basePaddingBottom + keyboardPadding;

    const scrollNodeIntoView = useCallback((node: View | null) => {
      const scrollView = scrollRef.current;
      const container = containerRef.current;
      if (!node || !scrollView || !container) {
        return;
      }

      container.measureInWindow((_cx, containerY, _cw, containerHeight) => {
        if (containerHeight <= 0) {
          return;
        }

        node.measureInWindow((_nx, nodeY, _nw, nodeHeight) => {
          if (nodeHeight <= 0) {
            return;
          }

          // Batas bawah area yang benar-benar terlihat: mana yang lebih tinggi
          // antara ujung bawah ScrollView dan garis atas keyboard.
          const visibleBottom = Math.min(
            containerY + containerHeight,
            frameBottomRef.current - windowOverlapRef.current
          );
          const visibleTop = containerY;

          const nodeBottom = nodeY + nodeHeight;
          const currentY = scrollYRef.current;

          let delta = 0;
          if (nodeBottom + FOCUS_MARGIN > visibleBottom) {
            delta = nodeBottom + FOCUS_MARGIN - visibleBottom;
          } else if (nodeY - FOCUS_MARGIN < visibleTop) {
            delta = nodeY - FOCUS_MARGIN - visibleTop;
          }

          if (Math.abs(delta) < 1) {
            return;
          }

          // Batas atas tidak diklem manual: tinggi konten bisa belum ter-update
          // tepat setelah padding keyboard berubah. ScrollView native sudah
          // membatasi gulir ke ujung konten.
          scrollView.scrollTo({ y: Math.max(currentY + delta, 0), animated: true });
        });
      });
    }, []);

    const scheduleScrollToActiveNode = useCallback(() => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
      focusTimerRef.current = setTimeout(() => {
        focusTimerRef.current = null;
        scrollNodeIntoView(activeNodeRef.current);
      }, MEASURE_DELAY_MS);
    }, [scrollNodeIntoView]);

    const ensureVisible = useCallback(
      (node: View | null) => {
        activeNodeRef.current = node;
        // Tunda agar keyboard sempat naik dan padding bawah sudah terpasang.
        scheduleScrollToActiveNode();
      },
      [scheduleScrollToActiveNode]
    );

    const releaseNode = useCallback((node: View | null) => {
      if (activeNodeRef.current === node) {
        activeNodeRef.current = null;
      }
    }, []);

    // Keyboard baru muncul atau tingginya berubah (bar emoji, ganti keyboard,
    // rotasi): hitung ulang posisi field yang sedang fokus setelah padding baru
    // sempat terpasang.
    useEffect(() => {
      if (windowOverlap <= 0 || !activeNodeRef.current) {
        return;
      }
      scheduleScrollToActiveNode();
    }, [keyboardPadding, scheduleScrollToActiveNode, windowOverlap]);

    useEffect(
      () => () => {
        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }
      },
      []
    );

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      },
      [onScroll]
    );

    const contextValue = useMemo<KeyboardAwareScrollContextValue>(
      () => ({ ensureVisible, releaseNode }),
      [ensureVisible, releaseNode]
    );

    return (
      <KeyboardAwareScrollContext.Provider value={contextValue}>
        {/*
          `collapsable={false}` wajib agar pembungkus tetap punya node native di
          Android, sehingga `measureInWindow` mengembalikan nilai yang benar.
        */}
        <View ref={containerRef} collapsable={false} style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              contentContainerStyle,
              keyboardPadding > 0 ? { paddingBottom } : null,
            ]}
            keyboardDismissMode={keyboardDismissMode}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            style={[styles.flex, style]}
            {...props}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAwareScrollContext.Provider>
    );
  }
);

export default KeyboardAwareScrollView;
export { KeyboardAwareScrollContext };

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
