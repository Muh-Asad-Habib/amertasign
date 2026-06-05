import { create } from 'zustand';

import {
  getCurrentUser,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from '../services/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  googleSignIn: () => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const user = await getCurrentUser();
      set({ isAuthenticated: Boolean(user), isLoading: false, user });
      return user;
    } catch (error) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      throw error;
    }
  },
  signIn: async (email, password) => {
    set({ isLoading: true });

    try {
      const user = await signInWithEmail(email, password);
      set({ isAuthenticated: true, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  signUp: async (name, email, password) => {
    set({ isLoading: true });

    try {
      const user = await signUpWithEmail(name, email, password);
      set({ isAuthenticated: true, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  googleSignIn: async () => {
    set({ isLoading: true });

    try {
      const user = await signInWithGoogle();
      set({ isAuthenticated: true, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: async () => {
    set({ isLoading: true });

    try {
      await signOut();
      set({ isAuthenticated: false, isLoading: false, user: null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
