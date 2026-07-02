import type { User } from '../types';

import { firebaseConfig } from './firebase';

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
  completedModuleIds: [],
});

export async function signInWithUsername(username: string, password: string): Promise<User> {
  void password;
  void firebaseConfig;
  // TODO: Ganti mock ini dengan autentikasi backend (username + password).
  await wait();
  currentUser = buildMockUser({ username });
  return currentUser;
}

export async function signUpWithUsername(username: string, password: string): Promise<User> {
  void password;
  // TODO: Ganti mock ini dengan pendaftaran backend (username + password).
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
    completedModuleIds: [],
  };
  return currentUser;
}

export async function signOut(): Promise<void> {
  // TODO: Replace this mock with Firebase Auth signOut.
  await wait(150);
  currentUser = null;
}

export async function getCurrentUser(): Promise<User | null> {
  // TODO: Replace this mock with Firebase Auth current user lookup or auth state listener.
  await wait(100);
  return currentUser;
}
