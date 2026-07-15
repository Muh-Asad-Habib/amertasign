import type { User } from '../types';
import { apiRequest, clearTokens, getAccessToken, saveTokens } from './api';

interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const GUEST_USER: User = {
  id: 'guest-user',
  name: 'Tamu',
  username: '',
  preferredSignLanguage: 'bisindo',
  streak: 0,
};

let isGuestSession = false;

export async function signInWithUsername(username: string, password: string): Promise<User> {
  const data = await apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  await saveTokens(data.accessToken, data.refreshToken);
  isGuestSession = false;
  return data.user;
}

export async function signUpWithUsername(
  username: string,
  password: string,
  email?: string
): Promise<User> {
  const data = await apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    body: { username, password, email },
  });

  await saveTokens(data.accessToken, data.refreshToken);
  isGuestSession = false;
  return data.user;
}

/** Masuk/daftar dengan Google: kirim ID token Google ke backend. */
export async function signInWithGoogleToken(idToken: string): Promise<User> {
  const data = await apiRequest<AuthPayload>('/auth/google', {
    method: 'POST',
    body: { idToken },
  });

  await saveTokens(data.accessToken, data.refreshToken);
  isGuestSession = false;
  return data.user;
}

/**
 * Selesaikan login Google alur web (backend OAuth): backend sudah menerbitkan
 * token sesi dan mengirimnya lewat deep link — simpan lalu ambil profil user.
 */
export async function completeGoogleSignIn(
  accessToken: string,
  refreshToken: string
): Promise<User> {
  await saveTokens(accessToken, refreshToken);
  isGuestSession = false;
  const data = await apiRequest<{ user: User }>('/auth/me', { auth: true });
  return data.user;
}

/** Lupa password: reset dengan verifikasi username + email terdaftar. */
export async function resetPassword(
  username: string,
  email: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { username, email, newPassword },
  });
}

export interface UpdateProfilePayload {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}

/** Perbarui profil (nama, username, email, foto). Mengembalikan user terbaru. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const data = await apiRequest<{ user: User }>('/users/me', {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
  return data.user;
}

/** Ganti password akun yang sedang login. */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/users/me/password', {
    method: 'PATCH',
    auth: true,
    body: { currentPassword, newPassword },
  });
}

export async function signInAsGuest(): Promise<User> {
  // Mode tamu: sepenuhnya lokal, tanpa request & tanpa token. Riwayat tidak disimpan.
  await clearTokens();
  isGuestSession = true;
  return GUEST_USER;
}

export async function signOut(): Promise<void> {
  if (!isGuestSession) {
    try {
      await apiRequest('/auth/logout', { method: 'POST', auth: true });
    } catch {
      // Token mungkin sudah tidak valid — tetap lanjut hapus token lokal.
    }
  }

  await clearTokens();
  isGuestSession = false;
}

export async function getCurrentUser(): Promise<User | null> {
  if (isGuestSession) {
    return GUEST_USER;
  }

  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const data = await apiRequest<{ user: User }>('/auth/me', { auth: true });
    return data.user;
  } catch {
    await clearTokens();
    return null;
  }
}
