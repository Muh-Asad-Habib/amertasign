import { useEffect, useRef, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

const POLL_INTERVAL_MS = 250;

export interface VideoProgress {
  /** Posisi pemutaran dalam detik. */
  currentTime: number;
  /** Durasi video dalam detik; 0 bila belum diketahui. */
  duration: number;
}

/**
 * `expo-video` tidak memancarkan event posisi yang murah, jadi posisi dibaca
 * berkala. Polling hanya berjalan saat memang dibutuhkan (kontrol terlihat)
 * agar tidak membebani render saat video berjalan tanpa kontrol.
 */
export function useVideoProgress(player: VideoPlayer | null, active: boolean): VideoProgress {
  const [progress, setProgress] = useState<VideoProgress>({ currentTime: 0, duration: 0 });
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!player || !active) {
      return;
    }

    const read = () => {
      const rawDuration = player.duration;
      const rawTime = player.currentTime;
      const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
      const currentTime = Number.isFinite(rawTime) && rawTime > 0 ? rawTime : 0;
      const previous = progressRef.current;

      // Hindari render ulang untuk perubahan yang tidak terlihat mata.
      if (
        Math.abs(previous.currentTime - currentTime) < 0.05 &&
        Math.abs(previous.duration - duration) < 0.05
      ) {
        return;
      }
      setProgress({ currentTime, duration });
    };

    read();
    const interval = setInterval(read, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [active, player]);

  return progress;
}

/** Format detik menjadi "m:ss" (video peraga selalu jauh di bawah satu jam). */
export function formatPlaybackTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export default useVideoProgress;
