/**
 * Penjaga agar hasil OAuth Google hanya diproses SEKALI.
 *
 * Deep link amertasign://google-auth bisa sampai ke app lewat dua jalur
 * sekaligus: (1) promise WebBrowser.openAuthSessionAsync di useGoogleAuth, dan
 * (2) navigasi expo-router ke route app/google-auth.tsx. Keduanya memanggil
 * claimGoogleAuthResult dengan kunci yang sama — hanya pemanggil pertama yang
 * boleh memproses token/error, sisanya diam.
 *
 * Klaim kedaluwarsa setelah TTL singkat: dua jalur pengiriman hasil yang sama
 * tiba dalam hitungan milidetik, sedangkan percobaan login BERIKUTNYA (mis.
 * pengguna membatalkan lalu mencoba lagi — kuncinya sama: "CANCELLED|...")
 * harus tetap bisa diproses, bukan diam tanpa umpan balik.
 */
const CLAIM_TTL_MS = 5_000;

const claimedAt = new Map<string, number>();

export function claimGoogleAuthResult(key: string): boolean {
  const now = Date.now();

  // Buang klaim lama agar Map tidak tumbuh sepanjang sesi.
  claimedAt.forEach((timestamp, existingKey) => {
    if (now - timestamp >= CLAIM_TTL_MS) {
      claimedAt.delete(existingKey);
    }
  });

  if (claimedAt.has(key)) {
    return false;
  }
  claimedAt.set(key, now);
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

