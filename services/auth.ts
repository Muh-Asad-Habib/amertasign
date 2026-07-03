import type { User } from '../types';

let currentUser: User | null = null;

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration));

const toDisplayName = (username: string) => {
  const formatted = username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return formatted || 'Pengguna';
};

const buildMockUser = ({ username, name }: { username: string; name?: string }): User => ({
  id: `mock-${username.toLowerCase()}`,
  name: name || toDisplayName(username),
  username: username.toLowerCase(),
  preferredSignLanguage: 'bisindo',
  streak: 0,
});

export async function signInWithUsername(username: string, password: string): Promise<User> {
  void password;
  // TODO: Ganti mock ini dengan POST /auth/login { username, password } lalu simpan token di expo-secure-store.
  await wait();
  currentUser = buildMockUser({ username });
  return currentUser;
}

export async function signUpWithUsername(username: string, password: string): Promise<User> {
  void password;
  // TODO: Ganti mock ini dengan POST /auth/register { username, password } lalu simpan token di expo-secure-store.
  await wait();
  currentUser = buildMockUser({ username });
  return currentUser;
}

export async function signInAsGuest(): Promise<User> {
  // Mode tamu: tidak perlu kredensial. Riwayat tidak dipersistensikan.
  await wait(150);
  currentUser = {
    id: 'guest-user',
    name: 'Tamu',
    username: '',
    preferredSignLanguage: 'bisindo',
    streak: 0,
  };
  return currentUser;
}

export async function signOut(): Promise<void> {
  // TODO: Ganti mock ini dengan POST /auth/logout lalu hapus token dari expo-secure-store.
  await wait(150);
  currentUser = null;
}

export async function getCurrentUser(): Promise<User | null> {
  // TODO: Ganti mock ini dengan GET /auth/me memakai token dari expo-secure-store (restore sesi saat app start).
  await wait(100);
  return currentUser;
}
