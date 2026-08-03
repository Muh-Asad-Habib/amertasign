import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import useFullscreenMode from '../../hooks/useFullscreenMode';
import useFullscreenHandoff, { type FullscreenPhase } from '../../hooks/useFullscreenHandoff';
import VideoTapArea from './VideoTapArea';

export interface FullscreenVideoModalProps {
  visible: boolean;
  onRequestClose: () => void;
  /** Tap di area video (di luar tombol kontrol) → tampil/sembunyikan kontrol. */
  onSurfacePress?: () => void;
  /**
   * Panggung video. Hanya dirender pada fase `open`, yaitu saat `VideoView`
   * inline dijamin sudah dilepas (lihat `useFullscreenHandoff`).
   */
  children: React.ReactNode;
  /** Lapisan kontrol, menerima safe-area insets orientasi saat ini. */
  renderControls?: (insets: EdgeInsets) => React.ReactNode;
  /**
   * Melaporkan fase serah-terima supaya induk tahu kapan boleh memasang kembali
   * `VideoView` inline miliknya.
   */
  onPhaseChange?: (phase: FullscreenPhase) => void;
}

function FullscreenBody({
  children,
  onSurfacePress,
  renderControls,
}: Pick<FullscreenVideoModalProps, 'children' | 'onSurfacePress' | 'renderControls'>) {
  const insets = useSafeAreaInsets();

  /*
   * Urutan lapisan (bawah → atas) penting dan tidak boleh ditukar:
   *   1. panggung video (pasif, tidak menerima sentuhan)
   *   2. lapisan ketuk — memunculkan / menyembunyikan kontrol
   *   3. lapisan kontrol — tombolnya menangani sentuhannya sendiri
   *
   * Lapisan ketuk sengaja BUKAN pembungkus panggung: `VideoView` milik
   * `expo-video` menelan sentuhan di Android lalu mengirimkannya kembali dengan
   * koordinat yang salah, sehingga `Pressable` pembungkus tidak pernah memicu
   * `onPress` (lihat catatan lengkap di `VideoTapArea`). Dulu inilah sebabnya
   * hanya ketukan pada bidang hitam yang bereaksi.
   */
  return (
    <View style={styles.root}>
      {/* Panggung dibuat pasif dan disembunyikan dari pembaca layar: lapisan
          ketuk di bawah ini yang menjadi satu-satunya sasaran fokus. */}
      <View
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.surface}
      >
        {children}
      </View>
      {onSurfacePress ? (
        <VideoTapArea
          accessibilityLabel="Tampilkan atau sembunyikan kontrol"
          onPress={onSurfacePress}
        />
      ) : null}
      {renderControls?.(insets)}
    </View>
  );
}

/**
 * Wadah layar penuh untuk video peraga. Modal dipilih (bukan rute baru) supaya
 * instance pemutar milik layar induk tetap hidup — hanya `VideoView`-nya yang
 * berpindah tempat, sehingga posisi pemutaran tidak ter-reset.
 *
 * Perpindahan itu dijalankan bertahap lewat `useFullscreenHandoff` supaya tidak
 * pernah ada dua `VideoView` hidup untuk satu pemutar (penyebab video hitam
 * yang muncul acak saat masuk/keluar layar penuh).
 */
export default function FullscreenVideoModal({
  visible,
  onRequestClose,
  onSurfacePress,
  children,
  renderControls,
  onPhaseChange,
}: FullscreenVideoModalProps) {
  const handoff = useFullscreenHandoff(visible);
  const { phase } = handoff;

  useFullscreenMode(phase);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      onShow={handoff.handleModalShown}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      transparent={false}
      visible={handoff.modalVisible}
    >
      {/* Provider sendiri: modal berada di luar hierarki safe-area layar induk. */}
      <SafeAreaProvider>
        <FullscreenBody onSurfacePress={onSurfacePress} renderControls={renderControls}>
          {handoff.fullscreenStageMounted ? children : null}
        </FullscreenBody>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#000000',
    flex: 1,
  },
  surface: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
