import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

import Heading from '../../components/ui/Heading';
import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, radius, shadow, spacing, touchTargetMin } from '../../theme';

export default function LiveTranslatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.fallback} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <View style={styles.permissionIcon}>
          <Ionicons color={colors.primary} name="videocam-outline" size={44} />
        </View>
        <Heading variant="title" align="center">
          Izinkan Kamera
        </Heading>
        <Text variant="body" color="secondary" align="center" style={styles.permissionText}>
          AmertaSign butuh akses kamera untuk menerjemahkan bahasa isyarat secara langsung.
        </Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Izinkan akses kamera"
          onPress={() => {
            void requestPermission();
          }}
          style={styles.permissionBtn}
        >
          <Text variant="bodyStrong" style={styles.permissionBtnText}>
            Izinkan Kamera
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Kamera full-screen (dilepas saat tab tidak aktif) */}
      {isFocused ? <CameraView facing="front" style={StyleSheet.absoluteFill} /> : null}

      {/* Gradasi gelap halus atas agar overlay terbaca */}
      <View style={styles.topScrim} pointerEvents="none" />

      {/* Header transparan */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text variant="label" style={styles.liveText}>
            Langsung
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Pengaturan"
          onPress={() => router.push('/(tabs)/settings')}
          style={styles.headerBtn}
        >
          <Ionicons color={colors.white} name="settings-outline" size={22} />
        </PressableScale>
      </View>

      {/* AI bounding box */}
      <View style={styles.boundingWrap} pointerEvents="none">
        <View style={styles.boundingBox}>
          <View style={styles.confidenceBadge}>
            <Text variant="label" style={styles.confidenceText}>
              Terima Kasih · 98%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const SCRIM = 'rgba(10, 14, 22, 0.45)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E16',
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.base,
  },
  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  permissionText: {
    maxWidth: 300,
  },
  permissionBtn: {
    minHeight: touchTargetMin,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadow.md,
  },
  permissionBtnText: {
    color: colors.textOnPrimary,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: SCRIM,
    opacity: 0.8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    zIndex: 10,
  },
  headerBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(10,14,22,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.error,
  },
  liveText: {
    color: colors.white,
  },
  boundingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingBox: {
    width: '70%',
    height: '46%',
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: radius.lg,
  },
  confidenceBadge: {
    position: 'absolute',
    top: -36,
    left: -3,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    ...shadow.sm,
  },
  confidenceText: {
    color: colors.textOnAccent,
  },
});
