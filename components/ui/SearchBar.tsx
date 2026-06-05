import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  surface: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
};

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Cari...',
  onClear,
}: SearchBarProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    onChangeText('');
  };

  return (
    <View accessibilityRole="search" style={styles.container}>
      <Ionicons color={COLORS.textSecondary} name="search" size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
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
          <Ionicons color={COLORS.primary} name="close-circle" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  input: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: 8,
    width: 32,
  },
  pressed: {
    opacity: 0.75,
  },
});
