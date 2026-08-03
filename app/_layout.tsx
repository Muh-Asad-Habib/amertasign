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
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useAuthStore } from '../store/useAuthStore';
import { useDictionaryStore } from '../store/useDictionaryStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { lockPortrait } from '../utils/orientation';

import { createSheet } from '../theme';

// Expose auth store on window for the dev screenshot script (dev builds only).
if (typeof window !== 'undefined' && __DEV__) {
  (window as any).__authStore = useAuthStore;
  (window as any).__settingsStore = useSettingsStore;
}

function AuthLoadingScreen({ fontsReady }: { fontsReady: boolean }) {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="dark" />
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.loadingTitle, fontsReady && styles.titleFont]}>Memeriksa sesi Anda...</Text>
      <Text style={[styles.loadingSubtitle, fontsReady && styles.bodyFont]}>
        Menyiapkan pengalaman belajar terbaik di Amerta Sign.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
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

  // Aplikasi dikunci portrait; hanya pemutar video layar penuh yang membuka
  // kunci ini sementara (manifest/Info.plist sengaja dibiarkan bebas).
  useEffect(() => {
    void lockPortrait();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        await Promise.all([initializeAuth(), useSettingsStore.getState().hydrate()]);
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

  // Expose router on window for the dev screenshot script.
  useEffect(() => {
    if (typeof window !== 'undefined' && __DEV__) {
      (window as any).__router = router;
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';
    // Route callback login Google (deep link amertasign://google-auth) harus
    // dibiarkan memproses token dulu — jangan dipantulkan ke layar login.
    const inGoogleAuthCallback = currentGroup === 'google-auth';
    // Panduan onboarding boleh dibuka ulang dari Pengaturan meski sudah masuk.
    const inOnboardingTour = inAuthGroup && (segments as string[])[1] === 'onboarding';

    // Tamu boleh membuka layar login/daftar (mis. dari tombol "Masuk / Daftar").
    // Hanya user login sungguhan yang dipantulkan keluar dari grup auth.
    if (isAuthenticated && !isGuest && inAuthGroup && !inOnboardingTour) {
      router.replace('/(tabs)/');
      return;
    }

    if (!isAuthenticated && currentGroup && !inAuthGroup && !inGoogleAuthCallback) {
      router.replace('/(auth)/login');
    }
  }, [isAuthReady, isAuthenticated, isGuest, router, segments]);

  // Setelah user siap, muat favorit & riwayat kamus lokal. Riwayat terjemahan
  // hanya untuk pengguna login (tamu tidak menyimpan riwayat di backend).
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    void useDictionaryStore.getState().loadFavorites();

    if (!isGuest) {
      void useHistoryStore.getState().loadHistory(user.id);
    }
  }, [isAuthenticated, isGuest, user]);

  const isReady = isAuthReady && fontsReady;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {isReady ? (
          <>
            <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
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
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = createSheet((colors) => ({
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
}));
