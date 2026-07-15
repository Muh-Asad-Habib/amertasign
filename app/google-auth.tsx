import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import Text from '../components/ui/Text';
import { colors, spacing, createSheet } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { claimGoogleAuthResult, googleAuthClaimKey } from '../services/googleAuthClaim';

/**
 * Tujuan deep link amertasign://google-auth dari backend (login Google alur web).
 * expo-router menavigasi ke route ini saat deep link tiba — proses token sesi
 * di sini lalu arahkan ke beranda / kembali ke login bila gagal.
 */
export default function GoogleAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    message?: string;
  }>();
  const signInWithGoogleTokens = useAuthStore((state) => state.signInWithGoogleTokens);

  useEffect(() => {
    const accessToken = typeof params.accessToken === 'string' ? params.accessToken : undefined;
    const refreshToken = typeof params.refreshToken === 'string' ? params.refreshToken : undefined;
    const error = typeof params.error === 'string' ? params.error : undefined;
    const message = typeof params.message === 'string' ? params.message : undefined;

    // Sudah/sedang ditangani oleh useGoogleAuth (openAuthSessionAsync)? Diam —
    // penangan tersebut yang akan menavigasi.
    if (!claimGoogleAuthResult(googleAuthClaimKey({ accessToken, error, message }))) {
      return;
    }

    const finish = async () => {
      if (error || !accessToken || !refreshToken) {
        if (error && error !== 'CANCELLED') {
          Alert.alert(
            'Masuk dengan Google gagal',
            message || 'Proses masuk Google gagal. Silakan coba lagi.'
          );
        }
        router.replace('/(auth)/login');
        return;
      }

      try {
        await signInWithGoogleTokens(accessToken, refreshToken);
        router.replace('/(tabs)/');
      } catch (err) {
        Alert.alert(
          'Masuk dengan Google gagal',
          err instanceof Error ? err.message : 'Terjadi kendala saat masuk. Silakan coba lagi.'
        );
        router.replace('/(auth)/login');
      }
    };

    void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ActivityIndicator color={colors.primary} size="large" />
      <Text variant="body" color="secondary" align="center" style={styles.caption}>
        Menyelesaikan masuk dengan Google...
      </Text>
    </View>
  );
}

const styles = createSheet((themeColors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: themeColors.background,
  },
  caption: {
    marginTop: 0,
  },
}));

