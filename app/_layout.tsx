import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useAuthStore } from '../store/useAuthStore';

function AuthLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="dark" />
      <ActivityIndicator color={Colors.light.primary} size="large" />
      <Text style={styles.loadingTitle}>Memeriksa sesi Anda...</Text>
      <Text style={styles.loadingSubtitle}>Menyiapkan pengalaman belajar terbaik di AmertaSign.</Text>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        await initializeAuth();
      } catch {
        useAuthStore.setState({ isAuthenticated: false, isLoading: false, user: null });
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const currentGroup = segments[0];

    if (isAuthenticated && currentGroup !== '(tabs)') {
      router.replace('/(tabs)/');
      return;
    }

    if (!isAuthenticated && currentGroup === '(tabs)') {
      router.replace('/(auth)/login');
    }
  }, [isAuthReady, isAuthenticated, router, segments]);

  return (
    <SafeAreaProvider>
      {isAuthReady ? (
        <>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: Colors.light.background,
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </>
      ) : (
        <AuthLoadingScreen />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
    backgroundColor: Colors.light.background,
  },
  loadingTitle: {
    marginTop: Layout.spacing.lg,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: Layout.spacing.sm,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
