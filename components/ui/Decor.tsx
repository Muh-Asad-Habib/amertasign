import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

export type DecorPreset = 'header' | 'auth' | 'corner' | 'ink';

export interface DecorProps {
  preset?: DecorPreset;
}

/**
 * Aksen dekoratif (blob & cincin) di balik konten — motif gestural editorial.
 * Selalu pointerEvents="none" agar tidak mengganggu interaksi.
 */
export default function Decor({ preset = 'header' }: DecorProps) {
  if (preset === 'auth') {
    return (
      <>
        <View pointerEvents="none" style={[styles.blob, styles.authSaffron]} />
        <View pointerEvents="none" style={[styles.blob, styles.authRing]} />
        <View pointerEvents="none" style={[styles.blob, styles.authTeal]} />
      </>
    );
  }

  if (preset === 'ink') {
    return (
      <>
        <View pointerEvents="none" style={[styles.blob, styles.inkTeal]} />
        <View pointerEvents="none" style={[styles.blob, styles.inkSaffron]} />
      </>
    );
  }

  if (preset === 'corner') {
    return <View pointerEvents="none" style={[styles.blob, styles.cornerSaffron]} />;
  }

  // header (default)
  return (
    <>
      <View pointerEvents="none" style={[styles.blob, styles.headerSaffron]} />
      <View pointerEvents="none" style={[styles.blob, styles.headerRing]} />
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  // header
  headerSaffron: {
    top: -70,
    right: -60,
    width: 200,
    height: 200,
    backgroundColor: colors.accentSurface,
    opacity: 0.7,
  },
  headerRing: {
    top: 40,
    right: 30,
    width: 90,
    height: 90,
    borderWidth: 12,
    borderColor: colors.primarySurface,
    opacity: 0.8,
  },
  // corner
  cornerSaffron: {
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    backgroundColor: colors.accentSurface,
    opacity: 0.55,
  },
  // auth
  authSaffron: {
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    backgroundColor: colors.accentSurface,
    opacity: 0.6,
  },
  authRing: {
    top: 70,
    left: -70,
    width: 180,
    height: 180,
    borderWidth: 22,
    borderColor: colors.primarySurface,
    opacity: 0.7,
  },
  authTeal: {
    bottom: -110,
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: colors.primarySurface,
    opacity: 0.4,
  },
  // ink (dark surfaces)
  inkTeal: {
    top: -80,
    left: -60,
    width: 240,
    height: 240,
    backgroundColor: colors.primary,
    opacity: 0.22,
  },
  inkSaffron: {
    bottom: -70,
    right: -50,
    width: 180,
    height: 180,
    backgroundColor: colors.accent,
    opacity: 0.14,
  },
});
