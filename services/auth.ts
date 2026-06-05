import type { User } from '../types';

import { firebaseConfig } from './firebase';

let currentUser: User | null = null;

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration));

const toDisplayName = (email: string) => {
  const localPart = email.split('@')[0] ?? 'Pengguna';
  const formatted = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return formatted || 'Pengguna';
};

const buildMockUser = ({ email, name }: { email: string; name: string }): User => ({
  id: `mock-${email.toLowerCase()}`,
  name,
  email: email.toLowerCase(),
  preferredSignLanguage: 'bisindo',
  streak: 0,
  completedModuleIds: [],
});

export async function signInWithEmail(email: string, password: string): Promise<User> {
  void password;
  void firebaseConfig;
  // TODO: Replace this mock with Firebase Auth signInWithEmailAndPassword.
  await wait();
  currentUser = buildMockUser({
    email,
    name: toDisplayName(email),
  });
  return currentUser;
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<User> {
  void password;
  // TODO: Replace this mock with Firebase Auth createUserWithEmailAndPassword and profile update.
  await wait();
  currentUser = buildMockUser({
    email,
    name,
  });
  return currentUser;
}

export async function signInWithGoogle(): Promise<User> {
  // TODO: Replace this mock with Google provider sign-in via Firebase Auth.
  await wait();
  currentUser = buildMockUser({
    email: 'google.user@amertasign.app',
    name: 'Google User',
  });
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
