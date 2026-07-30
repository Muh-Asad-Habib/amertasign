/** Formatter tanggal dan waktu berbahasa Indonesia. */

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Jam:menit 24 jam, mis. 09:05. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Label grup riwayat: Hari Ini, Kemarin, atau tanggal (mis. 5 Juli 2026). */
export function formatDayGroupLabel(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

  if (diffDays <= 0) {
    return 'Hari Ini';
  }
  if (diffDays === 1) {
    return 'Kemarin';
  }
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}
