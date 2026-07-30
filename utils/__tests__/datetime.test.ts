import { formatDayGroupLabel, formatTime } from '../datetime';

describe('formatTime', () => {
  it('memberi format 24 jam dengan dua digit', () => {
    const iso = new Date(2026, 6, 5, 9, 5).toISOString();
    expect(formatTime(iso)).toBe('09:05');
  });

  it('menangani tengah malam', () => {
    const iso = new Date(2026, 6, 5, 0, 0).toISOString();
    expect(formatTime(iso)).toBe('00:00');
  });
});

describe('formatDayGroupLabel', () => {
  const dayMs = 86_400_000;

  it('menandai hari ini', () => {
    expect(formatDayGroupLabel(new Date().toISOString())).toBe('Hari Ini');
  });

  it('menandai kemarin', () => {
    expect(formatDayGroupLabel(new Date(Date.now() - dayMs).toISOString())).toBe('Kemarin');
  });

  it('memakai tanggal Bahasa Indonesia untuk hari yang lebih lama', () => {
    const older = new Date(2026, 6, 5, 10, 0);
    expect(formatDayGroupLabel(older.toISOString())).toBe('5 Juli 2026');
  });
});
