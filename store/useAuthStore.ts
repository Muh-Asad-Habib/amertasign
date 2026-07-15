import { create } from 'zustand';

import {
  changePassword as changePasswordRequest,
  completeGoogleSignIn,
  getCurrentUser,
  resetPassword as resetPasswordRequest,
  signInAsGuest,
  signInWithGoogleToken,
  signInWithUsername,
  signOut,
  signUpWithUsername,
  updateProfile as updateProfileRequest,
  type UpdateProfilePayload,
} from '../services/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  initializeAuth: () => Promise<User | null>;
  signIn: (username: string, password: string) => Promise<User>;
  signUp: (username: string, password: string, email?: string) => Promise<User>;
  /** Masuk/daftar dengan akun Google (ID token dari Google Sign-In). */
  signInWithGoogle: (idToken: string) => Promise<User>;
  /** Selesaikan login Google alur web: token sesi datang dari deep link backend. */
  signInWithGoogleTokens: (accessToken: string, refreshToken: string) => Promise<User>;
  /** Reset password lewat verifikasi username + email terdaftar. */
  resetPassword: (username: string, email: string, newPassword: string) => Promise<void>;
  /** Perbarui profil user login (nama, username, email, foto). */
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  /** Ganti password user login. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  continueAsGuest: () => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
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
  signIn: async (username, password) => {
    set({ isLoading: true });

    try {
      const user = await signInWithUsername(username, password);
      set({ isAuthenticated: true, isGuest: false, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  signUp: async (username, password, email) => {
    set({ isLoading: true });

    try {
      const user = await signUpWithUsername(username, password, email);
      set({ isAuthenticated: true, isGuest: false, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  signInWithGoogle: async (idToken) => {
    set({ isLoading: true });

    try {
      const user = await signInWithGoogleToken(idToken);
      set({ isAuthenticated: true, isGuest: false, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  signInWithGoogleTokens: async (accessToken, refreshToken) => {
    set({ isLoading: true });

    try {
      const user = await completeGoogleSignIn(accessToken, refreshToken);
      set({ isAuthenticated: true, isGuest: false, isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  resetPassword: async (username, email, newPassword) => {
    set({ isLoading: true });

    try {
      await resetPasswordRequest(username, email, newPassword);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  updateProfile: async (payload) => {
    set({ isLoading: true });

    try {
      const user = await updateProfileRequest(payload);
      set({ isLoading: false, user });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });

    try {
      await changePasswordRequest(currentPassword, newPassword);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  continueAsGuest: async () => {
    set({ isLoading: true });

    try {
      const user = await signInAsGuest();
      set({ isAuthenticated: true, isGuest: true, isLoading: false, user });
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
      set({ isAuthenticated: false, isGuest: false, isLoading: false, user: null });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
