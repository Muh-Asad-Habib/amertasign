import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, overlay, radius } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type IconTone =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'solid'
  | 'solidAccent'
  | 'onBrand'
  | 'onInk';

type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconBubbleProps {
  name: IconName;
  tone?: IconTone;
  size?: IconSize;
  /** Bentuk lingkaran penuh (default: kotak membulat / squircle). */
  circle?: boolean;
  /** Override warna latar (mis. warna permen). */
  bg?: string;
  /** Override warna ikon. */
  fg?: string;
  style?: StyleProp<ViewStyle>;
}

/** Dibaca saat render agar mengikuti tema aktif (gelap/terang). */
const toneStyleFor = (tone: IconTone): { bg: string; fg: string } =>
  ({
    primary: { bg: colors.primarySurface, fg: colors.primary },
    accent: { bg: colors.accentSurface, fg: colors.accentStrong },
    success: { bg: colors.successTint, fg: colors.success },
    warning: { bg: colors.warningTint, fg: colors.accentStrong },
    error: { bg: colors.errorTint, fg: colors.error },
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
    solid: { bg: colors.primary, fg: colors.textOnPrimary },
    solidAccent: { bg: colors.accent, fg: colors.textOnAccent },
    onBrand: { bg: overlay.onBrandSoft, fg: colors.textOnPrimary },
    onInk: { bg: overlay.onInkSoft, fg: colors.surface },
  })[tone];

const sizeMap: Record<IconSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 40, icon: 20, radius: radius.md },
  md: { box: 52, icon: 26, radius: radius.lg },
  lg: { box: 64, icon: 30, radius: radius.xl },
  xl: { box: 80, icon: 38, radius: radius.xxl },
};

/**
 * Wadah ikon berwarna konsisten (squircle/lingkaran) — pengganti emoji-sebagai-ikon.
 * Memakai keluarga ikon tunggal (Ionicons) + token warna semantik.
 */
export default function IconBubble({
  name,
  tone = 'primary',
  size = 'md',
  circle = false,
  bg,
  fg,
  style,
}: IconBubbleProps) {
  const t = toneStyleFor(tone);
  const s = sizeMap[size];
  const background = bg ?? t.bg;
  const foreground = fg ?? t.fg;

  return (
    <View
      style={[
        {
          width: s.box,
          height: s.box,
          borderRadius: circle ? radius.full : s.radius,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={name} size={s.icon} color={foreground} />
    </View>
  );
}
