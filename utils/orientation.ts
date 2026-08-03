import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Aplikasi berjalan portrait secara default; kunci hanya dilepas sementara saat
 * pemutar video masuk mode layar penuh. Semua pemanggilan dibuat "aman gagal"
 * karena modul orientasi tidak tersedia di web.
 */
const isSupported = Platform.OS === 'android' || Platform.OS === 'ios';

export async function lockPortrait(): Promise<void> {
  if (!isSupported) {
    return;
  }
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch {
    // Perangkat menolak penguncian — biarkan orientasi apa adanya.
  }
}

export async function unlockOrientation(): Promise<void> {
  if (!isSupported) {
    return;
  }
  try {
    // Sengaja memakai lock ALL, bukan `unlockAsync()`: di iOS "unlock"
    // mengembalikan orientasi ke default Info.plist yang justru portrait.
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
  } catch {
    // Abaikan: layar penuh tetap berfungsi walau orientasi tidak bisa dibuka.
  }
}
