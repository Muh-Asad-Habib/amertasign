import { useEffect, useRef, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

/** Interval event `timeUpdate` bawaan pemutar peraga (detik). */
export const TIME_UPDATE_INTERVAL_S = 0.25;

/** Video peraga selalu pendek; nilai di luar batas ini pasti sampah. */
const MAX_PLAUSIBLE_DURATION_S = 6 * 60 * 60;

/**
 * Durasi dari `expo-video` tidak selalu bisa dipercaya: sebelum ExoPlayer siap,
 * `player.duration` masih 0 dan payload `sourceLoad` bisa berisi
 * `C.TIME_UNSET / 1000` (bilangan negatif raksasa). Semua sumber durasi wajib
 * lewat penjaga ini.
 */
export function isPlausibleDuration(value: number | null | undefined): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value < MAX_PLAUSIBLE_DURATION_S
  );
}

export interface VideoProgress {
  /** Posisi pemutaran dalam detik. */
  currentTime: number;
  /** Durasi video dalam detik; 0 bila belum diketahui. */
  duration: number;
}

const EMPTY_PROGRESS: VideoProgress = { currentTime: 0, duration: 0 };

/**
 * Posisi & durasi pemutaran untuk kontrol pemutar.
 *
 * Posisi diambil dari event `timeUpdate` milik `expo-video`, bukan polling
 * `player.currentTime`: getter itu memakai `runBlocking` ke thread UI, sehingga
 * membacanya empat kali per detik memblokir thread JS.
 *
 * Durasi diselesaikan berlapis karena tidak ada satu sumber pun yang selalu
 * benar: payload `sourceLoad` (bila wajar) → `player.duration` saat status
 * `readyToPlay` → percobaan ulang pada tiap `timeUpdate`. Tanpa ini durasi bisa
 * tetap 0 selamanya dan seek bar mati total (`PlayerSeekBar` mematikan
 * `PanResponder` saat durasi 0).
 */
export function useVideoProgress(player: VideoPlayer | null, active: boolean): VideoProgress {
  const [progress, setProgress] = useState<VideoProgress>(EMPTY_PROGRESS);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!player || !active) {
      return;
    }

    const commit = (next: VideoProgress) => {
      const previous = progressRef.current;
      if (
        Math.abs(previous.currentTime - next.currentTime) < 0.05 &&
        Math.abs(previous.duration - next.duration) < 0.05
      ) {
        return;
      }
      progressRef.current = next;
      setProgress(next);
    };

    /**
     * Nilai `player.duration` selalu didahulukan: klip berikutnya bisa punya
     * durasi berbeda, dan menahan nilai lama membuat seek bar memakai skala
     * klip sebelumnya (mis. 0:02 / 0:05 padahal klip ini hanya 0:04). Nilai
     * lama hanya dipakai selama pembacaan baru belum wajar.
     */
    const resolveDuration = (currentTime: number): number => {
      const raw = player.duration;
      if (isPlausibleDuration(raw)) {
        return Math.max(raw, currentTime);
      }
      const known = progressRef.current.duration;
      if (isPlausibleDuration(known)) {
        return Math.max(known, currentTime);
      }
      return 0;
    };

    const sync = (rawTime: number) => {
      const currentTime = Number.isFinite(rawTime) && rawTime > 0 ? rawTime : 0;
      commit({ currentTime, duration: resolveDuration(currentTime) });
    };

    // Klip lain punya durasi lain: nilai lama tidak boleh dipertahankan.
    const sourceSubscription = player.addListener('sourceLoad', ({ duration }) => {
      progressRef.current = {
        currentTime: 0,
        duration: isPlausibleDuration(duration) ? duration : 0,
      };
      setProgress(progressRef.current);
    });

    const timeSubscription = player.addListener('timeUpdate', ({ currentTime }) => {
      sync(currentTime);
    });

    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        sync(progressRef.current.currentTime);
      }
    });

    // Pastikan clock event benar-benar jalan selama kontrol dipakai, lalu
    // kembalikan ke nilai semula supaya pemilik pemutar tetap yang menentukan.
    const previousInterval = player.timeUpdateEventInterval;
    const shouldOverrideInterval = !(previousInterval > 0);
    if (shouldOverrideInterval) {
      player.timeUpdateEventInterval = TIME_UPDATE_INTERVAL_S;
    }

    sync(player.currentTime);

    return () => {
      sourceSubscription.remove();
      timeSubscription.remove();
      statusSubscription.remove();
      if (shouldOverrideInterval) {
        player.timeUpdateEventInterval = previousInterval;
      }
    };
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
