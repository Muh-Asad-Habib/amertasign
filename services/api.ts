import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'amertasign.accessToken';
const REFRESH_TOKEN_KEY = 'amertasign.refreshToken';

// Gateway produksi (nginx di VM API) — HTTPS, bebas CORS, diteruskan ke server hc-ai.
const PRODUCTION_API_URL = 'https://amertasign.lab-if.tech';

const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  // Saat dev, arahkan ke mesin yang menjalankan Metro (host yang sama dengan backend).
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:8000`;
    }
  }

  // Build rilis (APK) tanpa EXPO_PUBLIC_API_URL: pakai gateway produksi,
  // bukan localhost — device tidak bisa mengakses localhost milik dev.
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = resolveBaseUrl();

/** Ubah path media relatif dari backend menjadi URL absolut untuk Image/VideoView. */
export function resolveApiUrl(value: string): string {
  if (!value || /^(https?:|file:|content:|data:)/i.test(value)) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

// Keamanan: kredensial (login/register) dikirim ke URL ini. Untuk rilis produksi,
// EXPO_PUBLIC_API_URL WAJIB memakai https:// agar password & token tidak tersadap.
if (__DEV__ && API_BASE_URL.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.)/.test(API_BASE_URL)) {
  console.warn(
    `[api] API_BASE_URL memakai HTTP tanpa enkripsi (${API_BASE_URL}). ` +
    'Gunakan HTTPS untuk build produksi agar kredensial aman.'
  );
}

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
  /** Batas waktu request dalam ms (default 15 detik). */
  timeoutMs?: number;
}

/** Batas waktu default agar request tidak menggantung saat server tak terjangkau. */
const DEFAULT_TIMEOUT_MS = 15000;

/** fetch dengan batas waktu — melempar ApiError NETWORK_TIMEOUT bila lewat. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(
        0,
        'NETWORK_TIMEOUT',
        'Server tidak merespons. Pastikan perangkat satu jaringan dengan komputer dev dan relay/VPN aktif.'
      );
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.'
    );
  } finally {
    clearTimeout(timer);
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await tokenStorage.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return false;
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/v1/auth/refresh`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    },
    DEFAULT_TIMEOUT_MS
  );

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

  return fetchWithTimeout(
    `${API_BASE_URL}/api/v1${path}`,
    {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
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

interface UploadOptions {
  timeoutMs?: number;
  /** Sertakan Bearer token bila pengguna sedang login (default: true). */
  auth?: boolean;
}

async function rawUpload(
  path: string,
  formData: FormData,
  timeoutMs: number,
  auth: boolean
): Promise<Response> {
  // Content-Type sengaja tidak diset agar runtime menambahkan boundary multipart.
  const headers: Record<string, string> = {};

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return fetchWithTimeout(
    `${API_BASE_URL}/api/v1${path}`,
    { method: 'POST', headers, body: formData },
    timeoutMs
  );
}

/**
 * Unggah FormData (foto/video). Menyertakan Bearer token bila tersedia agar
 * endpoint terproteksi menerima identitas pengguna; mode tamu tetap jalan
 * karena header hanya ditambahkan saat token ada.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: UploadOptions | number = {}
): Promise<T> {
  // Kompatibilitas: pemanggil lama mengirim timeout sebagai angka.
  const { timeoutMs = 60000, auth = true } =
    typeof options === 'number' ? { timeoutMs: options, auth: true } : options;

  let response = await rawUpload(path, formData, timeoutMs, auth);

  // Access token kedaluwarsa → refresh sekali lalu ulangi unggahan.
  if (response.status === 401 && auth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await rawUpload(path, formData, timeoutMs, auth);
    }
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    // Ditangani sebagai respons invalid di bawah.
  }
  if (!response.ok || json?.success === false) {
    throw new ApiError(
      response.status,
      json?.error?.code ?? 'UPLOAD_ERROR',
      json?.error?.message ?? `Unggah gagal (HTTP ${response.status}).`
    );
  }
  return (json?.data ?? json) as T;
}
