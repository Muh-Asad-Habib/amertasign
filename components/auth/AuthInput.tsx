import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface AuthInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
}

export default function AuthInput({
  icon,
  isPasswordVisible = false,
  onToggleVisibility,
  placeholderTextColor = Colors.light.textSecondary,
  secureTextEntry,
  style,
  ...props
}: AuthInputProps) {
  const showToggle = typeof onToggleVisibility === 'function';

  return (
    <View style={styles.container}>
      <Ionicons color={Colors.light.textSecondary} name={icon} size={20} style={styles.leadingIcon} />
      <TextInput
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={secureTextEntry}
        style={[styles.input, style]}
        {...props}
      />
      {showToggle ? (
        <Pressable
          accessibilityLabel={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
          hitSlop={8}
          onPress={onToggleVisibility}
          style={styles.trailingButton}
        >
          <Ionicons
            color={Colors.light.textSecondary}
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: Layout.touchTargetMin,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  leadingIcon: {
    marginRight: Layout.spacing.sm,
  },
  input: {
    flex: 1,
    height: Layout.touchTargetMin,
    fontSize: Layout.fontSize.body,
    color: Colors.light.text,
  },
  trailingButton: {
    marginLeft: Layout.spacing.sm,
    minWidth: Layout.touchTargetMin,
    minHeight: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
