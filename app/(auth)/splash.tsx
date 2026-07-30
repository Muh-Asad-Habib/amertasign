import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import BrandMark from '../../components/ui/BrandMark';
import Heading from '../../components/ui/Heading';
import Sparkles from '../../components/ui/Sparkles';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { colors, gradients, overlay, spacing } from '../../theme';
import { hasSeenOnboarding } from '../../services/preferences';
import { useThemeMode } from '../../hooks/useThemeMode';

import { createSheet } from '../../theme';

export default function SplashScreen() {
  useThemeMode();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    let isMounted = true;
    // Onboarding hanya untuk pengguna baru; yang sudah pernah melihatnya
    // langsung diarahkan ke login agar tidak mengulang langkah yang sama.
    const timeout = setTimeout(() => {
      void hasSeenOnboarding().then((seen) => {
        if (isMounted) {
          router.replace(seen ? '/(auth)/login' : '/(auth)/onboarding');
        }
      });
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [router, fadeAnim, scaleAnim]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Cincin dekoratif lembut */}
      <View pointerEvents="none" style={[styles.ring, styles.ringTop]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringBottom]} />
      <Sparkles
        items={[
          { top: 90, right: 50, size: 22, color: '#FBC23C', delay: 0 },
          { top: 160, left: 44, size: 15, color: '#FFFDF8', delay: 300 },
          { bottom: 180, right: 70, size: 18, color: '#FFFDF8', delay: 600 },
          { bottom: 120, left: 70, size: 13, color: '#FBC23C', delay: 900 },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <BrandMark onDark size={128} />
          </Animated.View>
          <Animated.View style={[styles.copy, { opacity: fadeAnim }]}>
            <Heading variant="display" color="onPrimary" align="center">
              Amerta Sign
            </Heading>
            <View style={styles.squiggleWrap}>
              <Squiggle color={colors.accent} width={120} height={14} />
            </View>
            <Text variant="body" color="onPrimary" align="center" style={styles.tagline}>
              Jembatan Komunikasi Tanpa Batas
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = createSheet((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  copy: {
    alignItems: 'center',
  },
  squiggleWrap: {
    marginTop: spacing.sm,
  },
  tagline: {
    marginTop: spacing.base,
    opacity: 0.92,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: overlay.onBrandSoft,
    borderWidth: 28,
  },
  ringTop: {
    top: -120,
    left: -90,
    width: 280,
    height: 280,
  },
  ringBottom: {
    bottom: -140,
    right: -100,
    width: 320,
    height: 320,
  },
}));
