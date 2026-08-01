import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, layoutSpacing } from '../../theme';

import { createSheet } from '../../theme';
import { useSettingsStore } from '../../store/useSettingsStore';

export interface ScreenProps {
  children: React.ReactNode;
  /** Bungkus konten dengan ScrollView vertikal. Default: false. */
  scroll?: boolean;
  /** Terapkan padding tepi standar (screenPadding). Default: true. */
  padded?: boolean;
  /** Hindari keyboard menutupi input (iOS; Android memakai resize bawaan). Default: false. */
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
  const padding = padded ? layoutSpacing.screenPadding : 0;
  const backgroundColor = background ?? colors.background;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding, paddingBottom: padding + layoutSpacing.sectionGap }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { padding }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }, style]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
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
