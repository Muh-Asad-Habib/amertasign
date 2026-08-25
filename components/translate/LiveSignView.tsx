import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { API_BASE_URL } from '../../services/api';
import type { LiveHand } from '../../services/liveRecognition';
import { colors, fontFamily, overlay, radius, spacing } from '../../theme';
import Text from '../ui/Text';

import { createSheet } from '../../theme';
import { buildLiveTrackerHtml } from './liveTrackerHtml';

/** Fase kesiapan tracker di dalam WebView. */
export type LiveTrackerPhase = 'loading' | 'ready' | 'camera-on' | 'error';

export interface LiveSignViewProps {
  /** Dipanggil tiap frame landmark dari MediaPipe (di perangkat). */
  onFrame: (hands: LiveHand[], now: number) => void;
  /** Perubahan fase tracker (untuk menunda tombol rekam sampai siap). */
  onPhase?: (phase: LiveTrackerPhase, message: string) => void;
  /** Kamera depan/belakang. */
  facing: 'front' | 'back';
  /** Senter (best-effort; tidak semua perangkat mendukung via WebView). */
  torchEnabled?: boolean;
}

export interface LiveSignViewHandle {
  setTorch(on: boolean): void;
}

interface TrackerMessage {
  type: 'frame' | 'status';
  hands?: LiveHand[];
  now?: number;
  fps?: number;
  phase?: LiveTrackerPhase | 'torch-unsupported';
  message?: string;
}

/**
 * Pratinjau kamera live + deteksi tangan MediaPipe, berjalan dalam WebView
 * tersembunyi di balik UI native. Landmark (bukan video) diteruskan ke
 * React Native — pipeline yang sama persis dengan aplikasi web.
 *
 * `baseUrl` disetel ke URL backend (https) supaya halaman berjalan pada
 * secure context (syarat getUserMedia) sekaligus bisa memuat aset MediaPipe
 * dari origin yang sama.
 */
const LiveSignView = forwardRef<LiveSignViewHandle, LiveSignViewProps>(function LiveSignView(
  { onFrame, onPhase, facing, torchEnabled = false },
  ref
) {
  const webViewRef = useRef<WebView>(null);
  const [phase, setPhase] = useState<LiveTrackerPhase>('loading');
  const [statusMessage, setStatusMessage] = useState('Menyiapkan deteksi tangan…');
  const [handsDetected, setHandsDetected] = useState(0);

  const html = useMemo(() => buildLiveTrackerHtml(), []);

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onPhaseRef = useRef(onPhase);
  onPhaseRef.current = onPhase;

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    let message: TrackerMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as TrackerMessage;
    } catch {
      return;
    }
    if (message.type === 'frame' && Array.isArray(message.hands) && typeof message.now === 'number') {
      setHandsDetected(message.hands.length);
      onFrameRef.current(message.hands, message.now);
      return;
    }
    if (message.type === 'status' && message.phase && message.phase !== 'torch-unsupported') {
      setPhase(message.phase);
      setStatusMessage(message.message ?? '');
      onPhaseRef.current?.(message.phase, message.message ?? '');
    }
  }, []);

  // Perintah ke page. Nilai hanya 'front'/'back'/boolean — aman disisipkan.
  const sendFacing = useCallback((value: 'front' | 'back') => {
    webViewRef.current?.injectJavaScript(
      `window.__live && window.__live.setFacing('${value}'); true;`
    );
  }, []);
  const sendTorch = useCallback((on: boolean) => {
    webViewRef.current?.injectJavaScript(
      `window.__live && window.__live.setTorch(${on ? 'true' : 'false'}); true;`
    );
  }, []);

  useImperativeHandle(ref, () => ({ setTorch: sendTorch }), [sendTorch]);

  // Sinkronkan prop → page tanpa reload (reload = ±3 dtk muat ulang model).
  const lastFacingRef = useRef(facing);
  const lastTorchRef = useRef(torchEnabled);
  if (lastFacingRef.current !== facing) {
    lastFacingRef.current = facing;
    sendFacing(facing);
  }
  if (lastTorchRef.current !== torchEnabled) {
    lastTorchRef.current = torchEnabled;
    sendTorch(torchEnabled);
  }

  return (
    <View style={styles.container}>
      <WebView
        allowsInlineMediaPlayback
        cacheEnabled
        domStorageEnabled
        javaScriptEnabled
        mediaCapturePermissionGrantType="grant"
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
        originWhitelist={['*']}
        ref={webViewRef}
        scrollEnabled={false}
        setBuiltInZoomControls={false}
        source={{ html, baseUrl: API_BASE_URL }}
        style={styles.webview}
      />

      {phase !== 'camera-on' ? (
        <View pointerEvents="none" style={styles.statusOverlay}>
          <Ionicons
            color={phase === 'error' ? colors.error : colors.textOnPrimary}
            name={phase === 'error' ? 'alert-circle-outline' : 'hand-left-outline'}
            size={30}
          />
          <Text style={styles.statusText}>
            {phase === 'error'
              ? statusMessage || 'Deteksi tangan gagal dimuat. Periksa koneksi internet.'
              : statusMessage || 'Menyiapkan deteksi tangan…'}
          </Text>
        </View>
      ) : (
        <View pointerEvents="none" style={styles.handsPill}>
          <View style={[styles.handsDot, handsDetected > 0 && styles.handsDotActive]} />
          <Text style={styles.handsText}>
            {handsDetected > 0 ? `Tangan terdeteksi: ${handsDetected}` : 'Arahkan tangan ke kamera'}
          </Text>
        </View>
      )}
    </View>
  );
});

export default LiveSignView;

const styles = createSheet(() => ({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b1020',
  },
  webview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b1020',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: overlay.inkScrim,
    paddingHorizontal: spacing.xl,
  },
  statusText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
  handsPill: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: overlay.inkScrim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  handsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
  },
  handsDotActive: {
    backgroundColor: '#34d399',
  },
  handsText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
  },
}));
