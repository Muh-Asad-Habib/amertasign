import { useEffect, useState } from 'react';

import { textToSign } from '../services/translation';
import { useSettingsStore, type AvatarGender } from '../store/useSettingsStore';
import type { DictionaryEntry } from '../types';

interface ResolvedMedia {
  videoUrl: string;
  /** True bila server belum punya media peraga yang diminta untuk entri ini. */
  isFallback: boolean;
}

/** Cache per `entryId:peraga` — ganti layar/gender tidak memicu request ulang. */
const resolvedCache = new Map<string, ResolvedMedia>();

export interface EntrySignMedia {
  /** URL video sesuai peraga terpilih; undefined → media tidak tersedia. */
  videoUrl?: string;
  /** True selama media peraga alternatif masih diminta ke server. */
  isResolving: boolean;
  /** True bila video yang tampil bukan peraga yang diminta (belum tersedia). */
  isFallback: boolean;
  avatarGender: AvatarGender;
}

/**
 * URL video detail kamus mengikuti pilihan karakter peraga di Pengaturan.
 * `GET /dictionary` hanya menyimpan media peraga default (laki-laki), jadi untuk
 * peraga lain URL diminta lewat `POST /translate/text-to-sign` — endpoint yang
 * sama dengan fitur terjemahan — lalu di-cache. Bila media belum ada atau
 * jaringan bermasalah, video bawaan entri dipakai tanpa mengganggu pengguna.
 */
export default function useEntrySignMedia(entry?: DictionaryEntry): EntrySignMedia {
  const avatarGender = useSettingsStore((state) => state.avatarGender);
  // Peraga default sudah terwakili kolom videoUrl entri; hanya peraga lain
  // (dan hanya BISINDO) yang perlu resolusi ke server.
  const needsRemote = Boolean(entry && entry.type === 'bisindo' && avatarGender !== 'male');
  const cacheKey = entry ? `${entry.id}:${avatarGender}` : '';
  const [remote, setRemote] = useState<{ key: string; media: ResolvedMedia } | null>(null);

  useEffect(() => {
    if (!needsRemote || !entry) {
      return;
    }
    const cached = resolvedCache.get(cacheKey);
    if (cached) {
      setRemote({ key: cacheKey, media: cached });
      return;
    }
    let cancelled = false;
    (async () => {
      let media: ResolvedMedia = { videoUrl: entry.videoUrl, isFallback: true };
      try {
        const result = await textToSign(entry.word, entry.type, avatarGender);
        const unit = result.units.length === 1 ? result.units[0] : undefined;
        // Hanya kecocokan utuh yang mewakili entri; hasil ejaan per huruf
        // (mis. entri mock offline yang tidak ada di server) ditolak.
        if (unit && unit.matchType === 'exact') {
          media = {
            videoUrl: unit.videoUrl || entry.videoUrl,
            isFallback: result.avatarFallback === true || unit.avatar !== avatarGender,
          };
        }
        resolvedCache.set(cacheKey, media);
      } catch {
        // Jaringan/server bermasalah: pakai video bawaan tanpa menyimpan cache
        // agar kunjungan berikutnya mencoba lagi.
      }
      if (!cancelled) {
        setRemote({ key: cacheKey, media });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [avatarGender, cacheKey, entry, needsRemote]);

  if (!entry) {
    return { videoUrl: undefined, isResolving: false, isFallback: false, avatarGender };
  }
  if (!needsRemote) {
    return {
      videoUrl: entry.videoUrl || undefined,
      isResolving: false,
      isFallback: false,
      avatarGender,
    };
  }
  const media = remote && remote.key === cacheKey ? remote.media : resolvedCache.get(cacheKey);
  if (media) {
    return {
      videoUrl: media.videoUrl || undefined,
      isResolving: false,
      isFallback: media.isFallback,
      avatarGender,
    };
  }
  return { videoUrl: undefined, isResolving: true, isFallback: false, avatarGender };
}
