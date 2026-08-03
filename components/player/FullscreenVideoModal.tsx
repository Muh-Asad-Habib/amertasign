import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import useFullscreenMode from '../../hooks/useFullscreenMode';

export interface FullscreenVideoModalProps {
  visible: boolean;
  onRequestClose: () => void;
  /** Tap di area video (di luar tombol kontrol) → tampil/sembunyikan kontrol. */
  onSurfacePress?: () => void;
  /** Panggung video; direntangkan memenuhi layar. */
  children: React.ReactNode;
  /** Lapisan kontrol, menerima safe-area insets orientasi saat ini. */
  renderControls?: (insets: EdgeInsets) => React.ReactNode;
}

function FullscreenBody({
  children,
  onSurfacePress,
  renderControls,
}: Pick<FullscreenVideoModalProps, 'children' | 'onSurfacePress' | 'renderControls'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityLabel="Tampilkan atau sembunyikan kontrol"
        accessibilityRole="button"
        onPress={onSurfacePress}
        style={styles.surface}
      >
        {children}
      </Pressable>
      {renderControls?.(insets)}
    </View>
  );
}

/**
 * Wadah layar penuh untuk video peraga. Modal dipilih (bukan rute baru) supaya
 * instance pemutar milik layar induk tetap hidup — hanya `VideoView`-nya yang
 * berpindah tempat, sehingga posisi pemutaran tidak ter-reset.
 */
export default function FullscreenVideoModal({
  visible,
  onRequestClose,
  onSurfacePress,
  children,
  renderControls,
}: FullscreenVideoModalProps) {
  useFullscreenMode(visible, onRequestClose);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      transparent={false}
      visible={visible}
    >
      {/* Provider sendiri: modal berada di luar hierarki safe-area layar induk. */}
      <SafeAreaProvider>
        <FullscreenBody onSurfacePress={onSurfacePress} renderControls={renderControls}>
          {children}
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
