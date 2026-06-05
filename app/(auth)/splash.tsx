import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function SplashScreen() {
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

    const timeout = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2500);

    return () => clearTimeout(timeout);
  }, [router, fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoArea,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.logoEmoji}>🤟</Text>
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          AmertaSign
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
          Jembatan Komunikasi Tanpa Batas
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: Colors.light.primary,
  },
  logoArea: {
    width: 120,
    height: 120,
    borderRadius: Layout.radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logoEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: Layout.fontSize.hero,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tagline: {
    marginTop: Layout.spacing.sm,
    fontSize: Layout.fontSize.body,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.92,
  },
});
