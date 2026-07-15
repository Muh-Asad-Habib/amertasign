/**
 * Penjaga agar hasil OAuth Google hanya diproses SEKALI.
 *
 * Deep link amertasign://google-auth bisa sampai ke app lewat dua jalur
 * sekaligus: (1) promise WebBrowser.openAuthSessionAsync di useGoogleAuth, dan
 * (2) navigasi expo-router ke route app/google-auth.tsx. Keduanya memanggil
 * claimGoogleAuthResult dengan kunci yang sama — hanya pemanggil pertama yang
 * boleh memproses token/error, sisanya diam.
 */
const claimedKeys = new Set<string>();

export function claimGoogleAuthResult(key: string): boolean {
  if (claimedKeys.has(key)) {
    return false;
  }
  claimedKeys.add(key);
  return true;
}

/** Kunci klaim deterministik dari parameter hasil OAuth. */
export function googleAuthClaimKey(params: {
  accessToken?: string;
  error?: string;
  message?: string;
}): string {
  return params.accessToken ?? `${params.error ?? 'none'}|${params.message ?? ''}`;
}

