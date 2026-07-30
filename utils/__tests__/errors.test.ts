import { ApiError } from '../../services/api';
import { isNetworkError, toUserMessage } from '../errors';

describe('toUserMessage', () => {
  it('memetakan kode error yang dikenal ke pesan Bahasa Indonesia', () => {
    expect(toUserMessage(new ApiError(408, 'NETWORK_TIMEOUT', 'timeout'))).toContain(
      'terlalu lama merespons'
    );
    expect(toUserMessage(new ApiError(413, 'FILE_TOO_LARGE', 'too large'))).toContain(
      'terlalu besar'
    );
  });

  it('memakai status HTTP saat kode tidak dikenal', () => {
    expect(toUserMessage(new ApiError(401, 'SOMETHING_ELSE', 'raw'))).toContain('Sesi Anda');
    expect(toUserMessage(new ApiError(403, 'SOMETHING_ELSE', 'raw'))).toContain('belum memiliki akses');
    expect(toUserMessage(new ApiError(500, 'SOMETHING_ELSE', 'raw'))).toContain('Server sedang bermasalah');
  });

  it('memakai pesan server bila kode dan status tidak dikenali', () => {
    expect(toUserMessage(new ApiError(422, 'VALIDATION', 'Username sudah dipakai.'))).toBe(
      'Username sudah dipakai.'
    );
  });

  it('memakai fallback untuk nilai yang bukan Error', () => {
    expect(toUserMessage('boom', 'Gagal.')).toBe('Gagal.');
    expect(toUserMessage(null, 'Gagal.')).toBe('Gagal.');
  });
});

describe('isNetworkError', () => {
  it('hanya benar untuk kegagalan koneksi', () => {
    expect(isNetworkError(new ApiError(0, 'NETWORK_ERROR', 'offline'))).toBe(true);
    expect(isNetworkError(new ApiError(0, 'NETWORK_TIMEOUT', 'timeout'))).toBe(true);
    expect(isNetworkError(new ApiError(500, 'SERVER_ERROR', 'boom'))).toBe(false);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});
