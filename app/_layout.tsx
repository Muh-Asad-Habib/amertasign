import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
} from '@expo-google-fonts/lexend';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, fontFamily, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

function AuthLoadingScreen({ fontsReady }: { fontsReady: boolean }) {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="dark" />
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.loadingTitle, fontsReady && styles.titleFont]}>Memeriksa sesi Anda...</Text>
      <Text style={[styles.loadingSubtitle, fontsReady && styles.bodyFont]}>
        Menyiapkan pengalaman belajar terbaik di AmertaSign.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
  });

  // Fallback: jika font gagal dimuat, tetap lanjut dengan font sistem.
  const fontsReady = fontsLoaded || Boolean(fontError);

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
    const inAuthGroup = currentGroup === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/');
      return;
    }

    if (!isAuthenticated && currentGroup && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthReady, isAuthenticated, router, segments]);

  const isReady = isAuthReady && fontsReady;

  return (
    <SafeAreaProvider>
      {isReady ? (
        <>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </>
      ) : (
        <AuthLoadingScreen fontsReady={fontsReady} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingTitle: {
    marginTop: spacing.lg,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  titleFont: {
    fontFamily: fontFamily.displayExtraBold,
    fontWeight: undefined,
  },
  loadingSubtitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bodyFont: {
    fontFamily: fontFamily.bodyRegular,
  },
});
