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

export async function signUpWithUsername(username: string, password: string): Promise<User> {
  const data = await apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    body: { username, password },
  });

  await saveTokens(data.accessToken, data.refreshToken);
  isGuestSession = false;
  return data.user;
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
