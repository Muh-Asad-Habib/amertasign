import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, layoutSpacing } from '../../theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Bungkus konten dengan ScrollView vertikal. Default: false. */
  scroll?: boolean;
  /** Terapkan padding tepi standar (screenPadding). Default: true. */
  padded?: boolean;
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
  edges = ['top'],
  background = colors.background,
  contentStyle,
  style,
}: ScreenProps) {
  const padding = padded ? layoutSpacing.screenPadding : 0;

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor: background }, style]}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ padding, paddingBottom: padding + layoutSpacing.sectionGap }, contentStyle]}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { padding }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
