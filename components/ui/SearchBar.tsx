import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius, touchTargetMin } from '../../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Cari...', onClear }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    onChangeText('');
  };

  return (
    <View
      accessibilityRole="search"
      style={[styles.container, focused && styles.containerFocused]}
    >
      <Ionicons color={focused ? colors.primary : colors.textSecondary} name="search" size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Hapus pencarian"
          hitSlop={8}
          onPress={handleClear}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="close-circle" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: touchTargetMin,
    paddingHorizontal: 14,
    gap: 10,
  },
  containerFocused: {
    backgroundColor: colors.surface,
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
});
