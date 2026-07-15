import { useCallback, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { API_BASE_URL } from '../services/api';
import { claimGoogleAuthResult, googleAuthClaimKey } from '../services/googleAuthClaim';
import { useAuthStore } from '../store/useAuthStore';

// Selesaikan sesi browser yang menggantung (wajib untuk auth session).
WebBrowser.maybeCompleteAuthSession();


export interface UseGoogleAuthOptions {
  /** Dipanggil setelah backend memverifikasi login dan user berhasil masuk. */
  onSuccess: () => void;
  /** Dipanggil bila proses gagal (dibatalkan pengguna tidak dianggap gagal). */
  onError: (message: string) => void;
}

/**
 * Masuk/daftar dengan akun Google memakai OAuth client tipe WEB (arahan dosen:
 * client Android menyusul setelah rilis).
 *
 * Alur: buka browser ke backend /auth/google/start → login Google → Google
 * redirect ke backend /auth/google/callback (URL https publik) → backend tukar
 * authorization code memakai client secret → backend deep link balik ke app
 * (amertasign://google-auth) membawa token sesi aplikasi.
 *
 * Konfigurasi sepenuhnya di server: AMERTASIGN_GOOGLE_CLIENT_IDS,
 * AMERTASIGN_GOOGLE_CLIENT_SECRET, AMERTASIGN_PUBLIC_BASE_URL.
 */
export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  const signInWithGoogleTokens = useAuthStore((state) => state.signInWithGoogleTokens);
  const [isProcessing, setIsProcessing] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const promptGoogleSignIn = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Deep link balik: amertasign://google-auth di APK,
      // exp://<host>/--/google-auth di Expo Go.
      const returnUrl = Linking.createURL('google-auth');
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/api/v1/auth/google/start?returnUrl=${encodeURIComponent(returnUrl)}`,
        returnUrl
      );

      // 'cancel' / 'dismiss' — pengguna menutup browser, bukan error.
      if (result.type !== 'success' || !('url' in result) || !result.url) {
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const error = typeof queryParams?.error === 'string' ? queryParams.error : undefined;
      const message =
        typeof queryParams?.message === 'string' && queryParams.message
          ? queryParams.message
          : undefined;
      const accessToken =
        typeof queryParams?.accessToken === 'string' ? queryParams.accessToken : undefined;
      const refreshToken =
        typeof queryParams?.refreshToken === 'string' ? queryParams.refreshToken : undefined;

      // Deep link yang sama mungkin sudah ditangani route app/google-auth.tsx
      // (expo-router). Hanya penangan pertama yang memproses.
      if (!claimGoogleAuthResult(googleAuthClaimKey({ accessToken, error, message }))) {
        return;
      }

      if (error) {
        if (error !== 'CANCELLED') {
          onErrorRef.current(message ?? 'Proses masuk Google gagal. Silakan coba lagi.');
        }
        return;
      }

      if (!accessToken || !refreshToken) {
        onErrorRef.current('Server tidak mengirim token sesi. Silakan coba lagi.');
        return;
      }

      await signInWithGoogleTokens(accessToken, refreshToken);
      onSuccessRef.current();
    } catch (err) {
      onErrorRef.current(
        err instanceof Error ? err.message : 'Gagal masuk dengan Google. Coba lagi.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [signInWithGoogleTokens]);

  return {
    /** Selalu true — konfigurasi ada di server; error server tampil via onError. */
    isConfigured: true,
    /** true saat browser login / verifikasi backend berjalan. */
    isGoogleLoading: isProcessing,
    promptGoogleSignIn,
  };
}

export default useGoogleAuth;

