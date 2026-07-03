import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'amertasign.accessToken';
const REFRESH_TOKEN_KEY = 'amertasign.refreshToken';

const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  // Saat dev, arahkan ke mesin yang menjalankan Metro (host yang sama dengan backend).
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }

  return 'http://localhost:8000';
};

export const API_BASE_URL = resolveBaseUrl();

// SecureStore tidak tersedia di web — pakai localStorage sebagai fallback.
const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function getAccessToken(): Promise<string | null> {
  return tokenStorage.get(ACCESS_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await tokenStorage.set(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await tokenStorage.set(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    tokenStorage.remove(ACCESS_TOKEN_KEY),
    tokenStorage.remove(REFRESH_TOKEN_KEY),
  ]);
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await tokenStorage.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return false;
  }

  const json = await response.json();
  const accessToken = json?.data?.accessToken;
  if (!accessToken) {
    return false;
  }

  await saveTokens(accessToken);
  return true;
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return fetch(`${API_BASE_URL}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/**
 * Panggil API backend. Response backend berbentuk { success, data } atau
 * { success: false, error: { code, message } }. Fungsi ini mengembalikan `data`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await rawRequest(path, options);

  // Access token kedaluwarsa → coba refresh sekali lalu ulangi.
  if (response.status === 401 && options.auth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await rawRequest(path, options);
    }
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    // biarkan null — ditangani di bawah
  }

  if (!response.ok || json?.success === false) {
    const code = json?.error?.code ?? 'UNKNOWN_ERROR';
    const message = json?.error?.message ?? `Permintaan gagal (HTTP ${response.status}).`;
    throw new ApiError(response.status, code, message);
  }

  return (json?.data ?? json) as T;
}
