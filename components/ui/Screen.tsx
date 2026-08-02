import React from 'react';
import {
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, layoutSpacing } from '../../theme';

import { createSheet } from '../../theme';
import { useKeyboardWindowOverlap } from '../../hooks/useKeyboardOverlap';
import { useSettingsStore } from '../../store/useSettingsStore';
import KeyboardAwareScrollView from './KeyboardAwareScrollView';

export interface ScreenProps {
  children: React.ReactNode;
  /** Bungkus konten dengan ScrollView vertikal. Default: false. */
  scroll?: boolean;
  /** Terapkan padding tepi standar (screenPadding). Default: true. */
  padded?: boolean;
  /**
   * Cegah keyboard menutupi input. Saat aktif, konten memakai
   * `KeyboardAwareScrollView` (menambah ruang bawah + menggulir ke field yang
   * fokus). Wajib untuk layar berisi input teks: sejak Expo SDK 54 Android
   * berjalan edge-to-edge sehingga `adjustResize` tidak lagi berpengaruh.
   * Default: false.
   */
  keyboardAvoiding?: boolean;
  /** RefreshControl untuk pull-to-refresh (hanya berlaku saat scroll aktif). */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  edges?: Edge[];
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

/** Pembungkus layar standar: safe-area + padding tepi + background konsisten. */
export default function Screen({
  children,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  refreshControl,
  edges = ['top'],
  background,
  contentStyle,
  style,
}: ScreenProps) {
  // Subscribe tema: semua layar berbasis Screen ikut re-render saat mode berubah.
  const themeMode = useSettingsStore((state) => state.themeMode);
  const insets = useSafeAreaInsets();
  const windowOverlap = useKeyboardWindowOverlap();
  // SafeAreaView sudah menyisakan ruang bawah bila edge 'bottom' aktif, jadi
  // bagian itu tidak boleh dihitung dua kali.
  const keyboardOverlap = Math.max(
    windowOverlap - (edges.includes('bottom') ? insets.bottom : 0),
    0
  );
  const padding = padded ? layoutSpacing.screenPadding : 0;
  const backgroundColor = background ?? colors.background;

  const scrollContentStyle = [
    { padding, paddingBottom: padding + layoutSpacing.sectionGap },
    contentStyle,
  ];

  let content: React.ReactNode;
  if (keyboardAvoiding && (scroll || refreshControl)) {
    content = (
      <KeyboardAwareScrollView
        contentContainerStyle={scrollContentStyle}
        refreshControl={refreshControl}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  } else if (scroll) {
    content = (
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      >
        {children}
      </ScrollView>
    );
  } else {
    // Tanpa scroll: sisakan ruang bawah manual supaya konten tidak tertimpa
    // keyboard (mis. daftar yang menggulir sendiri di dalam layar).
    content = (
      <View
        style={[
          styles.flex,
          { padding },
          contentStyle,
          keyboardAvoiding && keyboardOverlap > 0 ? { paddingBottom: padding + keyboardOverlap } : null,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }, style]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {content}
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
}));
