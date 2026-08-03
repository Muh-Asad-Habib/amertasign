import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface VideoTapAreaProps {
  /** Ketukan pada area video. */
  onPress: () => void;
  accessibilityLabel: string;
  /** Ditumpuk di atas `VideoView`; default memenuhi induknya. */
  style?: StyleProp<ViewStyle>;
  /** Nonaktifkan sementara (mis. media belum tersedia). */
  disabled?: boolean;
}

/**
 * Jarak maksimum jari boleh bergeser dan tetap dihitung sebagai ketukan. Nilai
 * ini sekaligus membuat gulir layar tidak salah terbaca sebagai ketuk.
 */
const TAP_SLOP = 14;

const ACCESSIBILITY_ACTIONS = [{ name: 'activate' }] as const;

/**
 * Lapisan penangkap ketukan untuk panggung video.
 *
 * SENGAJA memakai responder mentah, bukan `Pressable`/`Touchable`, dan SENGAJA
 * dipasang sebagai **saudara di atas** `VideoView`, bukan sebagai pembungkusnya.
 *
 * Alasannya ada di sisi Android `expo-video` (lihat expo/expo#34630 dan PR
 * #35479): `PlayerView` milik ExoPlayer menelan seluruh `MotionEvent`, sehingga
 * `VideoView.onTouchEvent` selalu mengembalikan `true` lalu mengirim ulang event
 * itu ke React Native secara manual. Pengiriman ulang tersebut memakai koordinat
 * **relatif terhadap `VideoView`**, padahal React Native memperlakukannya sebagai
 * `pageX`/`pageY` (koordinat layar). Akibatnya
 * `Pressability._isTouchWithinResponderRegion()` menyimpulkan jari berada di luar
 * tombol, lalu membatalkan tekanan — `onPress` milik `Pressable` yang membungkus
 * `VideoView` tidak pernah terpanggil. Itulah sebabnya dulu hanya ketukan pada
 * bidang hitam di luar video yang bereaksi.
 *
 * Karena lapisan ini berada di atas `VideoView`, sentuhan tidak pernah sampai ke
 * `PlayerView`: event mengalir lewat jalur normal React Native sehingga
 * koordinatnya benar. Responder mentah dipilih sebagai lapis pengaman kedua —
 * ia sama sekali tidak memakai perbandingan press-rect, jadi kebal terhadap
 * koordinat menyimpang dari sumber mana pun.
 */
export default function VideoTapArea({
  onPress,
  accessibilityLabel,
  style,
  disabled = false,
}: VideoTapAreaProps) {
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const handleGrant = useCallback((event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    startRef.current = { x: pageX, y: pageY };
    movedRef.current = false;
  }, []);

  const handleMove = useCallback((event: GestureResponderEvent) => {
    if (movedRef.current) {
      return;
    }
    const { pageX, pageY } = event.nativeEvent;
    const dx = pageX - startRef.current.x;
    const dy = pageY - startRef.current.y;
    if (Math.hypot(dx, dy) > TAP_SLOP) {
      movedRef.current = true;
    }
  }, []);

  const handleRelease = useCallback(() => {
    if (movedRef.current) {
      return;
    }
    onPress();
  }, [onPress]);

  const shouldSetResponder = useCallback(() => !disabled, [disabled]);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'activate') {
        onPress();
      }
    },
    [onPress]
  );

  return (
    <View
      // `onAccessibilityTap` hanya berlaku di iOS; TalkBack (Android) memicu
      // aksi bernama `activate`, jadi keduanya dipasang agar aktivasi lewat
      // pembaca layar tetap bekerja di dua platform.
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessible={!disabled}
      onAccessibilityAction={handleAccessibilityAction}
      onAccessibilityTap={onPress}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}
      // Gulir layar (mis. kartu peraga di dalam ScrollView) tetap harus bisa
      // mengambil alih sentuhan; ketukan yang direbut berakhir di `terminate`
      // dan memang tidak boleh dianggap sebagai ketuk.
      onResponderTerminationRequest={() => true}
      onStartShouldSetResponder={shouldSetResponder}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}
