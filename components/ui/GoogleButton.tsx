import React from 'react';
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fontFamily, radius, shadow } from '../../theme';
import PressableScale from './PressableScale';
import Text from './Text';

import { createSheet } from '../../theme';

/** Logo "G" resmi Google (4 warna) dalam SVG. */
function GoogleGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Path
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.1-5.1C33.9 6.3 29.2 4.4 24 4.4 13.2 4.4 4.4 13.2 4.4 24S13.2 43.6 24 43.6 43.6 34.8 43.6 24c0-1.2-.1-2.4-.4-3.5z"
        fill="#FFC107"
      />
      <Path
        d="M6.7 14.9l5.9 4.3C14.2 15.1 18.7 12 24 12c3.1 0 5.9 1.2 8 3l5.1-5.1C33.9 6.3 29.2 4.4 24 4.4c-7.7 0-14.3 4.3-17.3 10.5z"
        fill="#FF3D00"
      />
      <Path
        d="M24 43.6c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6 4.6c3 6.1 9.4 11.3 17.2 11.3z"
        fill="#4CAF50"
      />
      <Path
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.1 5.2c-.4.4 6.3-4.6 6.3-14.4 0-1.2-.1-2.4-.4-3.5z"
        fill="#1976D2"
      />
    </Svg>
  );
}

export interface GoogleButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Tombol "Masuk/Daftar dengan Google" sesuai pedoman branding Google. */
export default function GoogleButton({ title, onPress, disabled, loading, style }: GoogleButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.base, isDisabled && styles.disabled, style]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <GoogleGlyph />
        )}
        <Text variant="bodyStrong" style={styles.label}>
          {title}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = createSheet((colors) => ({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: '100%',
    ...shadow.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
  },
  disabled: {
    opacity: 0.5,
  },
}));

