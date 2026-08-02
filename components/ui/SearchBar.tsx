import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius, shadow, spacing } from '../../theme';
import { useEnsureVisibleOnFocus } from './KeyboardAwareScrollView';

import { createSheet } from '../../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Cari...', onClear }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  // Jaga kolom pencarian tetap terlihat saat keyboard naik.
  const { wrapperRef, handleFocus, handleBlur } = useEnsureVisibleOnFocus();

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    onChangeText('');
  };

  return (
    <View
      ref={wrapperRef}
      accessibilityRole="search"
      collapsable={false}
      style={[styles.container, focused && styles.containerFocused]}
    >
      <Ionicons color={focused ? colors.primary : colors.textSecondary} name="search" size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        onChangeText={onChangeText}
        onFocus={() => {
          setFocused(true);
          handleFocus();
        }}
        onBlur={() => {
          setFocused(false);
          handleBlur();
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hapus pencarian"
          hitSlop={10}
          onPress={handleClear}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="close-circle" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = createSheet((colors) => ({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: spacing.base,
    gap: 10,
    ...shadow.sm,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pressed: {
    opacity: 0.75,
  },
}));
