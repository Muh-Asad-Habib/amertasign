import { useEffect, useRef, useState } from 'react';
import { useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';

import type { TextToSignUnit } from '../../services/translation';

/** URL video hanya dipakai bila unit memang bertipe video dan URL-nya ada. */
export function videoUriOf(unit?: TextToSignUnit): string | null {
  if (unit?.mediaType === 'video' && unit.videoUrl) {
    return unit.videoUrl;
  }
  return null;
}

export interface SignSequenceVideoOptions {
  unit?: TextToSignUnit;
  /**
   * Penanda gerakan yang sedang tampil. Dipakai agar gerakan berulang dengan
   * video yang sama (mis. huruf "A A") tetap diputar ulang dari awal.
   */
  unitKey: number;
  /** Rangkaian sedang berjalan (auto-play). */
  isPlaying: boolean;
  /** Pengganda kecepatan peragaan (0,5 · 1 · 1,5). */
  speed: number;
  /** Durasi video gerakan aktif dalam milidetik (null bila belum/tidak diketahui). */
  onDurationLoaded: (durationMs: number | null, unitKey: number) => void;
  /** Dipanggil saat video gerakan selesai diputar. */
  onEnded: (unitKey: number) => void;
}

export interface SignSequenceVideo {
  player: VideoPlayer;
  videoUri: string | null;
  isBuffering: boolean;
}

/**
 * Mesin pemutar rangkaian peraga isyarat: SATU instance pemutar dipakai ulang
 * untuk seluruh rangkaian (sumber diganti lewat `replaceAsync`) sehingga
 * perpindahan antar gerakan mulus — tidak ada remount/kedip seperti saat tiap
 * gerakan memakai pemutar sendiri.
 *
 * Hook ini sengaja dipisahkan dari komponen panggung supaya `VideoView` bisa
 * dipindah antara tampilan inline dan modal layar penuh tanpa membuat ulang
 * pemutar (posisi & gerakan aktif tidak ter-reset).
 */
export function useSignSequenceVideo({
  unit,
  unitKey,
  isPlaying,
  speed,
  onDurationLoaded,
  onEnded,
}: SignSequenceVideoOptions): SignSequenceVideo {
  const videoUri = videoUriOf(unit);
  const [isBuffering, setIsBuffering] = useState(false);

  // Dibaca di dalam callback async supaya tidak memakai nilai usang.
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  isPlayingRef.current = isPlaying;
  speedRef.current = speed;

  /** `unitKey` dari sumber yang benar-benar sudah dimuat ke pemutar. */
  const loadedKeyRef = useRef<number | null>(null);
  const durationMsRef = useRef<number | null>(null);
  const durationReportedRef = useRef(false);
  /**
   * Pemuatan sumber diantrikan: dua `replaceAsync` yang tumpang tindih (mis.
   * chip gerakan ditekan beruntun) tidak dijamin selesai sesuai urutan panggil.
   */
  const loadQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  useEffect(() => {
    let cancelled = false;

    // Sumber lama tidak boleh lanjut terputar selama sumber baru dimuat.
    loadedKeyRef.current = null;
    durationMsRef.current = null;
    durationReportedRef.current = false;
    player.pause();

    const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
      const next = loadQueueRef.current.then(task, task);
      loadQueueRef.current = next.catch(() => {});
      return next;
    };

    if (!videoUri) {
      setIsBuffering(false);
      enqueue(() => player.replaceAsync(null)).catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    setIsBuffering(true);
    enqueue(() => player.replaceAsync({ uri: videoUri, useCaching: true }))
      .then(() => {
        if (cancelled) {
          return;
        }
        loadedKeyRef.current = unitKey;
        // playbackRate bisa ikut ter-reset saat sumber diganti.
        player.playbackRate = speedRef.current;
        if (isPlayingRef.current) {
          player.play();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsBuffering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [player, unitKey, videoUri]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  useEffect(() => {
    if (!videoUri) {
      return;
    }
    if (!isPlaying) {
      player.pause();
      return;
    }
    // Hanya putar bila sumber untuk gerakan ini memang sudah termuat.
    if (loadedKeyRef.current === unitKey) {
      player.play();
    }
  }, [isPlaying, player, unitKey, videoUri]);

  useEventListener(player, 'playToEnd', () => {
    const loadedKey = loadedKeyRef.current;
    if (loadedKey !== null) {
      onEnded(loadedKey);
    }
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    setIsBuffering(false);
    durationMsRef.current = Number.isFinite(duration) && duration > 0 ? duration * 1000 : null;
  });

  /**
   * Durasi baru dilaporkan saat pemutaran benar-benar dimulai — `sourceLoad`
   * hanya menandakan metadata siap, sehingga memakainya sebagai titik awal
   * membuat penjadwalan gerakan berikutnya terlalu cepat saat masih buffering.
   */
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    const loadedKey = loadedKeyRef.current;
    if (!playing || durationReportedRef.current || loadedKey === null) {
      return;
    }
    durationReportedRef.current = true;
    onDurationLoaded(durationMsRef.current, loadedKey);
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    setIsBuffering(status === 'loading');
  });

  return { player, videoUri, isBuffering };
}

export default useSignSequenceVideo;
