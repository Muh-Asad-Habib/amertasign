import { useCallback, useEffect, useRef, useState } from 'react';
import { useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';

import type { TextToSignUnit } from '../../services/translation';
import useVideoFrameRefresh from '../../hooks/useVideoFrameRefresh';

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
  /**
   * Memaksa satu frame digambar ulang pada surface saat ini. Dipakai setelah
   * `VideoView` berpindah antara panggung inline dan layar penuh sementara
   * pemutar sedang dijeda — tanpa ini surface baru bisa tetap kosong.
   */
  refreshFrame: () => void;
}

/** Ambang untuk menganggap posisi pemutaran sudah di ujung klip. */
const END_EPSILON_MS = 250;

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
  const onEndedRef = useRef(onEnded);
  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  onEndedRef.current = onEnded;

  /** `unitKey` dari sumber yang benar-benar sudah dimuat ke pemutar. */
  const loadedKeyRef = useRef<number | null>(null);
  const durationMsRef = useRef<number | null>(null);
  const durationReportedRef = useRef(false);
  /**
   * Klip yang sudah habis saat rangkaian sedang dijeda. Event `playToEnd`-nya
   * tidak boleh dibuang: pemutar berhenti di posisi akhir, sehingga `play()`
   * berikutnya tidak menghasilkan apa pun dan tombol putar terasa rusak.
   */
  const pendingEndRef = useRef<number | null>(null);
  /**
   * Pemuatan sumber diantrikan: dua `replaceAsync` yang tumpang tindih (mis.
   * chip gerakan ditekan beruntun) tidak dijamin selesai sesuai urutan panggil.
   */
  const loadQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  /**
   * Posisi pemutaran sudah mentok di ujung klip. Durasi yang belum diketahui
   * dianggap "belum di ujung" supaya pemutaran biasa tidak salah dilewati.
   */
  const isAtClipEnd = useCallback(() => {
    const durationMs = durationMsRef.current;
    return durationMs !== null && player.currentTime * 1000 >= durationMs - END_EPSILON_MS;
  }, [player]);

  /** Mulai memutar; bila posisi mentok di ujung klip, kembalikan dulu ke awal. */
  const playFromSafePosition = useCallback(() => {
    if (isAtClipEnd()) {
      player.currentTime = 0;
    }
    player.play();
  }, [isAtClipEnd, player]);

  const refreshFrame = useVideoFrameRefresh(player);

  useEffect(() => {
    let cancelled = false;

    // Sumber lama tidak boleh lanjut terputar selama sumber baru dimuat.
    loadedKeyRef.current = null;
    durationMsRef.current = null;
    durationReportedRef.current = false;
    pendingEndRef.current = null;
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
        } else {
          // Sedang dijeda: pastikan frame pertama gerakan baru tetap tampil
          // supaya tombol sebelumnya/berikutnya terlihat bereaksi.
          refreshFrame();
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
  }, [player, refreshFrame, unitKey, videoUri]);

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
    if (loadedKeyRef.current !== unitKey) {
      return;
    }
    // Klip sudah habis saat dijeda: lanjutkan rangkaian, jangan `play()` di
    // posisi akhir yang tidak menghasilkan apa pun. Penanda ini hanya berlaku
    // bila posisi memang masih di ujung — pengguna bisa saja menggeser mundur
    // lebih dulu, dan gerakan ini tidak boleh dilewati begitu saja.
    const pendingEnd = pendingEndRef.current;
    pendingEndRef.current = null;
    if (pendingEnd !== null && isAtClipEnd()) {
      onEndedRef.current(pendingEnd);
      return;
    }
    playFromSafePosition();
  }, [isAtClipEnd, isPlaying, playFromSafePosition, player, unitKey, videoUri]);

  useEventListener(player, 'playToEnd', () => {
    const loadedKey = loadedKeyRef.current;
    if (loadedKey === null) {
      return;
    }
    if (!isPlayingRef.current) {
      pendingEndRef.current = loadedKey;
      return;
    }
    pendingEndRef.current = null;
    onEndedRef.current(loadedKey);
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

  return { player, videoUri, isBuffering, refreshFrame };
}

export default useSignSequenceVideo;
