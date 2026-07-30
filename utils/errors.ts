import { ApiError } from '../services/api';

/**
 * Pesan siap tampil untuk kode error backend/jaringan. Tujuannya menjaga agar
 * pengguna (dan penilai saat demo) tidak pernah melihat pesan teknis mentah.
 */
const MESSAGE_BY_CODE: Record<string, string> = {
  NETWORK_TIMEOUT: 'Server terlalu lama merespons. Periksa koneksi internet Anda lalu coba lagi.',
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Pastikan perangkat tersambung ke internet.',
  UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  FORBIDDEN: 'Anda belum memiliki akses untuk fitur ini.',
  FILE_TOO_LARGE: 'Ukuran berkas terlalu besar. Rekam ulang dengan durasi lebih singkat.',
  UNSUPPORTED_MEDIA: 'Format media belum didukung. Gunakan video MP4 atau foto JPG/PNG.',
  PROCESSING_TIMEOUT: 'Analisis memakan waktu terlalu lama. Coba rekam ulang dengan durasi lebih singkat.',
  AI_PROCESSING_FAILED: 'Isyarat belum bisa dianalisis. Pastikan pencahayaan cukup lalu coba lagi.',
  UPLOAD_ERROR: 'Media gagal diunggah. Periksa koneksi lalu coba lagi.',
};

/** True bila kegagalan berasal dari koneksi, bukan dari respons server. */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.code === 'NETWORK_TIMEOUT' || error.code === 'NETWORK_ERROR')
  );
}

/**
 * Ubah error apa pun menjadi kalimat Bahasa Indonesia yang bisa ditindaklanjuti.
 * `fallback` dipakai saat error tidak dikenali sama sekali.
 */
export function toUserMessage(error: unknown, fallback = 'Terjadi kendala. Silakan coba lagi.'): string {
  if (error instanceof ApiError) {
    const mapped = MESSAGE_BY_CODE[error.code];
    if (mapped) {
      return mapped;
    }

    if (error.status === 401) {
      return MESSAGE_BY_CODE.UNAUTHORIZED;
    }
    if (error.status === 403) {
      return MESSAGE_BY_CODE.FORBIDDEN;
    }
    if (error.status === 413) {
      return MESSAGE_BY_CODE.FILE_TOO_LARGE;
    }
    if (error.status >= 500) {
      return 'Server sedang bermasalah. Coba lagi beberapa saat lagi.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
