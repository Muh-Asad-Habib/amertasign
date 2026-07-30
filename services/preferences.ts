import { tokenStorage } from './api';

const ONBOARDING_SEEN_KEY = 'amertasign.hasSeenOnboarding';

/** True bila pengguna sudah pernah menyelesaikan onboarding di perangkat ini. */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await tokenStorage.get(ONBOARDING_SEEN_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** Tandai onboarding sudah dilihat agar tidak tampil lagi pada kunjungan berikutnya. */
export async function markOnboardingSeen(): Promise<void> {
  try {
    await tokenStorage.set(ONBOARDING_SEEN_KEY, 'true');
  } catch {
    // Gagal menyimpan bukan kondisi fatal — onboarding hanya akan tampil lagi.
  }
}
