import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, fontFamily, layoutSpacing, radius, spacing, touchTargetMin } from '../../theme';
import { useEnsureVisibleOnFocus } from './KeyboardAwareScrollView';
import Text from './Text';

import { createSheet } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  helperText?: string;
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
}

/**
 * Field input dengan label, ikon, state focus/error, dan helper text.
 * Mendukung ref ke TextInput untuk rantai fokus antar field (returnKeyType="next").
 */
const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    icon,
    error,
    helperText,
    isPasswordVisible = false,
    onToggleVisibility,
    placeholderTextColor = colors.textTertiary,
    secureTextEntry,
    style,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const showToggle = typeof onToggleVisibility === 'function';
  // Jaga field tetap terlihat saat keyboard naik (di dalam KeyboardAwareScrollView).
  const { wrapperRef, handleFocus, handleBlur } = useEnsureVisibleOnFocus();

  // Umumkan error ke pembaca layar saat muncul — teks merah saja tidak cukup.
  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(`Kesalahan: ${error}`);
    }
  }, [error]);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View ref={wrapperRef} collapsable={false} style={styles.wrapper}>
      {label ? (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View style={[styles.field, { borderColor }, focused && !error && styles.fieldFocused]}>
        {icon ? <Ionicons color={focused ? colors.primary : colors.textTertiary} name={icon} size={20} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          style={[styles.input, !!icon && styles.inputWithIcon, style]}
          onFocus={(e) => {
            setFocused(true);
            handleFocus();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            handleBlur();
            onBlur?.(e);
          }}
          {...props}
        />
        {showToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
            hitSlop={8}
            onPress={onToggleVisibility}
            style={styles.trailingButton}
          >
            <Ionicons color={colors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color="error" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="tertiary" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;

const styles = createSheet((colors) => ({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 2,
  },
  field: {
    minHeight: touchTargetMin,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layoutSpacing.cardPadding,
    gap: 10,
  },
  fieldFocused: {
    backgroundColor: colors.primarySurface,
  },
  input: {
    flex: 1,
    height: touchTargetMin,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    color: colors.text,
  },
  inputWithIcon: {
    marginLeft: 0,
  },
  trailingButton: {
    minWidth: touchTargetMin,
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  helper: {
    marginLeft: 2,
  },
}));
