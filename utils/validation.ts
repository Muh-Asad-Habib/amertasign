/** Aturan validasi input yang dipakai di seluruh layar autentikasi dan profil. */

export const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const PASSWORD_MIN_LENGTH = 6;

/** bcrypt di backend hanya memproses 72 byte pertama — batasi agar tidak terpotong diam-diam. */
export const PASSWORD_MAX_LENGTH = 72;

export const VALIDATION_MESSAGES = {
  username: 'Username 3-20 karakter, hanya huruf, angka, titik, garis bawah, atau strip.',
  email: 'Masukkan alamat email yang benar, contoh: nama@email.com.',
  passwordMin: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`,
  passwordMax: `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`,
} as const;

export const isValidUsername = (value: string) => USERNAME_REGEX.test(value);

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value);
